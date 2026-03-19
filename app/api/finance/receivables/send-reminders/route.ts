import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeReceivables, financeWorkLogs } from '@/db/schema';
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

    const workLogIds = receivables
      .map((item) => item.workLogId)
      .filter((id): id is string => Boolean(id));

    const workLogs = workLogIds.length
      ? await db
          .select({
            id: financeWorkLogs.id,
            minutesWorked: financeWorkLogs.minutesWorked,
            hourlyRateCents: financeWorkLogs.hourlyRateCents,
          })
          .from(financeWorkLogs)
          .where(
            and(
              eq(financeWorkLogs.userId, session.user.id),
              inArray(financeWorkLogs.id, workLogIds),
            ),
          )
      : [];

    const workLogMap = new Map(workLogs.map((log) => [log.id, log]));

    let sent = 0;
    const now = new Date();

    for (const item of receivables) {
      if (!item.payerEmail) {
        continue;
      }

      const includeWorkDetails = parsed.includeWorkDetails ?? item.includeWorkDetails;
      const includeDueDate = parsed.includeDueDate ?? true;
      const linkedWorkLog = item.workLogId ? workLogMap.get(item.workLogId) : null;
      const minutesWorked = item.minutesWorked ?? linkedWorkLog?.minutesWorked ?? null;
      const hourlyRateCents = item.hourlyRateCents ?? linkedWorkLog?.hourlyRateCents ?? null;

      const detailsLine =
        includeWorkDetails && minutesWorked && hourlyRateCents
          ? `\nWork hours: ${hoursLabel(minutesWorked)}h\nRate: $${toCurrency(hourlyRateCents)} / hour`
          : '';

      const dueLine =
        includeDueDate && item.dueAt ? `\nDue date: ${item.dueAt.toLocaleDateString()}` : '';
      const customMessage = parsed.customMessage ? `\n\n${parsed.customMessage.trim()}` : '';

      const text = `Hello ${item.payerName},\n\nThis is a payment reminder for "${item.title}".\nAmount due: $${toCurrency(item.amountCents)}${dueLine}${detailsLine}${customMessage}\n\nPlease let me know once payment is completed.\nThank you.`;

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <p>Hello ${item.payerName},</p>
          <p>This is a payment reminder for <strong>${item.title}</strong>.</p>
          <p><strong>Amount due:</strong> $${toCurrency(item.amountCents)}</p>
          ${includeDueDate && item.dueAt ? `<p><strong>Due date:</strong> ${item.dueAt.toLocaleDateString()}</p>` : ''}
          ${
            includeWorkDetails && minutesWorked && hourlyRateCents
              ? `<p><strong>Work hours:</strong> ${hoursLabel(minutesWorked)}h<br/><strong>Rate:</strong> $${toCurrency(hourlyRateCents)} / hour</p>`
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
