import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeReceivables } from '@/db/schema';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { financeReceivableReminderSchema } from '@/lib/validations';

function toCurrency(cents: number): string {
  return (cents / 100).toFixed(2);
}

function hoursLabel(minutesWorked: number): string {
  const hours = minutesWorked / 60;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(2);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = financeReceivableReminderSchema.parse(body);

    const receivables = await db
      .select()
      .from(financeReceivables)
      .where(
        and(
          eq(financeReceivables.userId, session.user.id),
          inArray(financeReceivables.id, parsed.ids),
          eq(financeReceivables.status, 'pending'),
        ),
      );

    let sent = 0;
    const now = new Date();

    for (const item of receivables) {
      if (!item.payerEmail) {
        continue;
      }

      const includeWorkDetails = parsed.includeWorkDetails ?? item.includeWorkDetails;

      const detailsLine =
        includeWorkDetails && item.minutesWorked && item.hourlyRateCents
          ? `\nWork hours: ${hoursLabel(item.minutesWorked)}h\nRate: $${toCurrency(item.hourlyRateCents)} / hour`
          : '';

      const dueLine = item.dueAt ? `\nDue date: ${item.dueAt.toLocaleDateString()}` : '';
      const customMessage = parsed.customMessage ? `\n\n${parsed.customMessage.trim()}` : '';

      const text = `Hello ${item.payerName},\n\nThis is a payment reminder for "${item.title}".\nAmount due: $${toCurrency(item.amountCents)}${dueLine}${detailsLine}${customMessage}\n\nPlease let me know once payment is completed.\nThank you.`;

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <p>Hello ${item.payerName},</p>
          <p>This is a payment reminder for <strong>${item.title}</strong>.</p>
          <p><strong>Amount due:</strong> $${toCurrency(item.amountCents)}</p>
          ${item.dueAt ? `<p><strong>Due date:</strong> ${item.dueAt.toLocaleDateString()}</p>` : ''}
          ${
            includeWorkDetails && item.minutesWorked && item.hourlyRateCents
              ? `<p><strong>Work hours:</strong> ${hoursLabel(item.minutesWorked)}h<br/><strong>Rate:</strong> $${toCurrency(item.hourlyRateCents)} / hour</p>`
              : ''
          }
          ${item.note ? `<p><strong>Notes:</strong> ${item.note}</p>` : ''}
          ${parsed.customMessage ? `<p>${parsed.customMessage.trim()}</p>` : ''}
          <p>Please let me know once payment is completed. Thank you.</p>
        </div>
      `;

      const ok = await sendEmail({
        to: item.payerEmail,
        subject: `Payment reminder: ${item.title} ($${toCurrency(item.amountCents)})`,
        text,
        html,
      });

      if (!ok) {
        continue;
      }

      await db
        .update(financeReceivables)
        .set({
          lastReminderSentAt: now,
          updatedAt: now,
        })
        .where(
          and(eq(financeReceivables.id, item.id), eq(financeReceivables.userId, session.user.id)),
        );

      sent += 1;
    }

    return NextResponse.json({ sent }, { status: 200 });
  } catch (error) {
    console.error('Failed to send receivable reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 400 });
  }
}
