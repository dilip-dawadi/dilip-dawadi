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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textToHtmlParagraphs(value: string): string {
  return escapeHtml(value).replaceAll('\n', '<br/>');
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

    const senderName = session.user.name?.trim() || 'Dilip';

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
      const noteLine = item.note ? `\nReference: ${item.note}` : '';
      const customMessageLine = parsed.customMessage
        ? `\n\nAdditional note:\n${parsed.customMessage.trim()}`
        : '';

      const text = `Hello ${item.payerName},

I hope you are doing well.

This is a payment reminder regarding the pending payment for "${item.title}".

Payment details:
- Amount due: $${toCurrency(item.amountCents)}${dueLine}${detailsLine}${noteLine}${customMessageLine}

Please confirm once payment has been completed. If payment has already been sent, kindly disregard this reminder.

Thank you for your time and support.

Best regards,
${senderName}`;

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <p>Hello ${escapeHtml(item.payerName)},</p>
          <p>I hope you are doing well.</p>
          <p>This is a payment reminder regarding the pending payment for <strong>${escapeHtml(item.title)}</strong>.</p>

          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px 14px; margin:14px 0;">
            <p style="margin:0 0 8px;"><strong>Payment details</strong></p>
            <p style="margin:0;"><strong>Amount due:</strong> $${toCurrency(item.amountCents)}</p>
            ${includeDueDate && item.dueAt ? `<p style="margin:6px 0 0;"><strong>Due date:</strong> ${item.dueAt.toLocaleDateString()}</p>` : ''}
            ${
              includeWorkDetails && minutesWorked && hourlyRateCents
                ? `<p style="margin:6px 0 0;"><strong>Work hours:</strong> ${hoursLabel(minutesWorked)}h<br/><strong>Rate:</strong> $${toCurrency(hourlyRateCents)} / hour</p>`
                : ''
            }
            ${item.note ? `<p style="margin:6px 0 0;"><strong>Reference:</strong> ${textToHtmlParagraphs(item.note)}</p>` : ''}
          </div>

          ${parsed.customMessage ? `<p><strong>Additional note:</strong><br/>${textToHtmlParagraphs(parsed.customMessage.trim())}</p>` : ''}

          <p>Please confirm once payment has been completed. If payment has already been sent, kindly disregard this reminder.</p>
          <p>Thank you for your time and support.</p>
          <p style="margin-top:14px;">Best regards,<br/>${escapeHtml(senderName)}</p>
        </div>
      `;

      const ok = await sendEmail({
        to: item.payerEmail,
        subject: `Payment reminder: ${item.title} (Amount due: $${toCurrency(item.amountCents)})`,
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
