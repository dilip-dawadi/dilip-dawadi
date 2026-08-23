import { and, eq, gte, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { financeWorkLogs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { financeWorkLogReportSchema } from '@/lib/validations';
import { createWorkLogReportPdf } from '@/lib/work-log-report-pdf';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toCurrency(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function hoursLabel(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

function toDateRange(periodStart: string, periodEnd: string): { start: Date; endExclusive: Date } {
  const start = new Date(`${periodStart}T00:00:00.000Z`);
  const endExclusive = new Date(`${periodEnd}T00:00:00.000Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, endExclusive };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = financeWorkLogReportSchema.parse(body);
    const { start, endExclusive } = toDateRange(parsed.periodStart, parsed.periodEnd);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(endExclusive.getTime()) ||
      start >= endExclusive
    ) {
      return NextResponse.json({ error: 'Invalid period range' }, { status: 400 });
    }

    const logs = await db
      .select({
        workDate: financeWorkLogs.workDate,
        minutesWorked: financeWorkLogs.minutesWorked,
        hourlyRateCents: financeWorkLogs.hourlyRateCents,
        note: financeWorkLogs.note,
      })
      .from(financeWorkLogs)
      .where(
        and(
          eq(financeWorkLogs.userId, session.user.id),
          gte(financeWorkLogs.workDate, start),
          lt(financeWorkLogs.workDate, endExclusive),
        ),
      );

    if (logs.length === 0) {
      return NextResponse.json({ error: 'No shifts found for selected period' }, { status: 400 });
    }

    const totalMinutes = logs.reduce((sum, item) => sum + item.minutesWorked, 0);
    const totalPayCents = logs.reduce(
      (sum, item) => sum + Math.round((item.minutesWorked / 60) * item.hourlyRateCents),
      0,
    );
    const taxAmountCents = parsed.taxAmountCents || 0;
    const subtotalCents = totalPayCents;
    const totalDueCents = subtotalCents + taxAmountCents;
    const currencyCode = (parsed.currencyCode?.trim() || 'CAD').toUpperCase();

    const senderName = session.user.name?.trim() || 'Contractor';
    const greetingName = parsed.employerName?.trim() || 'there';
    const clientName = parsed.clientName?.trim() || '[Company Name]';
    const invoiceNumber = parsed.invoiceNumber?.trim() || `INV-${new Date().getFullYear()}-001`;
    const invoiceDate = parsed.invoiceDate?.trim() || new Date().toISOString().slice(0, 10);
    const serviceDescription =
      parsed.serviceDescription?.trim() || 'Cabinet Installation Helper Services';
    const paymentMethod = parsed.paymentMethod?.trim() || 'E-Transfer';
    const paymentEmail = parsed.paymentEmail?.trim() || 'your-email@example.com';
    const paymentDueLabel = parsed.paymentDueLabel?.trim() || 'Upon Receipt';
    const taxLabel = parsed.taxLabel?.trim() || 'Tax';

    const rowsText = logs
      .map((item, index) => {
        const dateText = item.workDate.toLocaleDateString();
        const hours = hoursLabel(item.minutesWorked);
        const rate = toCurrency(item.hourlyRateCents, currencyCode);
        const rowTotal = toCurrency(
          Math.round((item.minutesWorked / 60) * item.hourlyRateCents),
          currencyCode,
        );
        const note = item.note?.trim() ? ` | Note: ${item.note.trim()}` : '';
        return `${index + 1}. ${dateText} | Hours: ${hours} | Rate: ${rate} | Total: ${rowTotal}${note}`;
      })
      .join('\n');

    const customMessageText = parsed.message?.trim() ? `\n${parsed.message.trim()}\n` : '';

    const shiftLogText = `Hi ${greetingName},

Please find my contractor shift log for the biweekly period ${parsed.periodStart} to ${parsed.periodEnd}.${customMessageText}
Shift details:
${rowsText}

Summary:
- Total shifts: ${logs.length}
- Total hours: ${hoursLabel(totalMinutes)}
- Total pay: ${toCurrency(totalPayCents, currencyCode)}

Thanks,
${senderName}`;

    const invoiceText = `Invoice

Invoice #: ${invoiceNumber}
Invoice Date: ${invoiceDate}
Work Period: ${parsed.periodStart} - ${parsed.periodEnd}
Contractor: ${senderName}
Client: ${clientName}

Services Provided
- Description: ${serviceDescription}
- Hours: ${hoursLabel(totalMinutes)}
- Amount: ${toCurrency(subtotalCents, currencyCode)}

Subtotal: ${toCurrency(subtotalCents, currencyCode)}
${taxLabel}: ${taxAmountCents > 0 ? toCurrency(taxAmountCents, currencyCode) : 'N/A (Not Registered)'}
Total Due: ${toCurrency(totalDueCents, currencyCode)}

Payment Method: ${paymentMethod}
Payment Email: ${paymentEmail}
Payment Due: ${paymentDueLabel}`;

    const rowsHtml = logs
      .map((item, index) => {
        const dateText = item.workDate.toLocaleDateString();
        const hours = hoursLabel(item.minutesWorked);
        const rate = toCurrency(item.hourlyRateCents, currencyCode);
        const rowTotal = toCurrency(
          Math.round((item.minutesWorked / 60) * item.hourlyRateCents),
          currencyCode,
        );
        const note = item.note?.trim()
          ? `<div style="color:#6b7280; font-size:12px; margin-top:4px;">Note: ${escapeHtml(item.note.trim())}</div>`
          : '';

        return `<tr>
  <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${index + 1}</td>
  <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${escapeHtml(dateText)}</td>
  <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${escapeHtml(hours)}</td>
  <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${escapeHtml(rate)}</td>
  <td style="padding:10px; border-bottom:1px solid #e5e7eb;">${escapeHtml(rowTotal)}${note}</td>
</tr>`;
      })
      .join('');

    const shiftLogHtml = `<div style="font-family: Arial, sans-serif; color:#111827; line-height:1.6; margin-top:24px;">
  <h2 style="margin:0 0 10px; font-size:22px;">Biweekly Shift Log</h2>
  <p>Hi ${escapeHtml(greetingName)},</p>
  <p>Please find my contractor shift log for the biweekly period <strong>${escapeHtml(parsed.periodStart)}</strong> to <strong>${escapeHtml(parsed.periodEnd)}</strong>.</p>
  ${parsed.message?.trim() ? `<p>${escapeHtml(parsed.message.trim())}</p>` : ''}

  <table style="width:100%; border-collapse:collapse; margin-top:14px; margin-bottom:14px; font-size:14px;">
    <thead>
      <tr style="background:#f3f4f6; text-align:left;">
        <th style="padding:10px; border-bottom:1px solid #d1d5db;">#</th>
        <th style="padding:10px; border-bottom:1px solid #d1d5db;">Date</th>
        <th style="padding:10px; border-bottom:1px solid #d1d5db;">Hours</th>
        <th style="padding:10px; border-bottom:1px solid #d1d5db;">Rate</th>
        <th style="padding:10px; border-bottom:1px solid #d1d5db;">Row Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px;">
    <p style="margin:0;"><strong>Total shifts:</strong> ${logs.length}</p>
    <p style="margin:4px 0 0;"><strong>Total hours:</strong> ${escapeHtml(hoursLabel(totalMinutes))}</p>
    <p style="margin:4px 0 0;"><strong>Total pay:</strong> ${escapeHtml(toCurrency(totalPayCents, currencyCode))}</p>
  </div>

  <p style="margin-top:16px;">Thanks,<br/>${escapeHtml(senderName)}</p>
</div>`;

    const invoiceHtml = `<div style="font-family: Arial, sans-serif; background:transparent; color:#111827; padding:20px; border:1px solid #e5e7eb; border-radius:10px;">
  <h2 style="margin:0 0 16px; font-size:28px;">Invoice</h2>

  <div style="border-top:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; padding:8px 0; margin-bottom:12px;">
    <p style="margin:6px 0;"><strong>Invoice #:</strong> ${escapeHtml(invoiceNumber)}</p>
    <p style="margin:6px 0;"><strong>Invoice Date:</strong> ${escapeHtml(new Date(`${invoiceDate}T12:00:00`).toLocaleDateString())}</p>
    <p style="margin:6px 0;"><strong>Work Period:</strong> ${escapeHtml(new Date(`${parsed.periodStart}T12:00:00`).toLocaleDateString())} - ${escapeHtml(new Date(`${parsed.periodEnd}T12:00:00`).toLocaleDateString())}</p>
    <p style="margin:6px 0;"><strong>Contractor:</strong> ${escapeHtml(senderName)}</p>
    <p style="margin:6px 0;"><strong>Client:</strong> ${escapeHtml(clientName)}</p>
  </div>

  <h3 style="margin:16px 0 10px; font-size:20px;">Services Provided</h3>
  <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
    <thead>
      <tr style="border-bottom:1px solid #e5e7eb; text-align:left;">
        <th style="padding:10px 0;">Description</th>
        <th style="padding:10px 0;">Hours</th>
        <th style="padding:10px 0;">Rate</th>
        <th style="padding:10px 0; text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 0;">${escapeHtml(serviceDescription)}</td>
        <td style="padding:10px 0;">${escapeHtml(hoursLabel(totalMinutes))}</td>
        <td style="padding:10px 0;">${escapeHtml(toCurrency(Math.round(totalMinutes > 0 ? subtotalCents / (totalMinutes / 60) : 0), currencyCode))}/hr</td>
        <td style="padding:10px 0; text-align:right;">${escapeHtml(toCurrency(subtotalCents, currencyCode))}</td>
      </tr>
    </tbody>
  </table>

  <div style="border-top:1px solid #e5e7eb; padding-top:10px;">
    <p style="margin:8px 0; display:flex; justify-content:space-between;"><span><strong>Subtotal</strong></span><span>${escapeHtml(toCurrency(subtotalCents, currencyCode))}</span></p>
    <p style="margin:8px 0; display:flex; justify-content:space-between;"><span><strong>${escapeHtml(taxLabel)}</strong></span><span>${taxAmountCents > 0 ? escapeHtml(toCurrency(taxAmountCents, currencyCode)) : 'N/A (Not Registered)'}</span></p>
    <p style="margin:8px 0; display:flex; justify-content:space-between; font-size:22px;"><span><strong>Total Due</strong></span><span><strong>${escapeHtml(toCurrency(totalDueCents, currencyCode))} ${escapeHtml(currencyCode)}</strong></span></p>
  </div>

  <div style="margin-top:18px;">
    <p style="margin:4px 0;"><strong>Payment Method:</strong> ${escapeHtml(paymentMethod)}</p>
    <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(paymentEmail)}</p>
    <p style="margin:4px 0;"><strong>Payment Due:</strong> ${escapeHtml(paymentDueLabel)}</p>
  </div>
</div>`;

    const includeInvoice = parsed.reportFormat === 'invoice' || parsed.reportFormat === 'both';
    const includeShiftLog = parsed.reportFormat === 'shift-log' || parsed.reportFormat === 'both';

    const summaryParts: string[] = [];

    if (includeInvoice) {
      summaryParts.push(`Invoice PDF attached (${invoiceNumber}).`);
    }

    if (includeShiftLog) {
      summaryParts.push(
        `Shift summary PDF attached (${parsed.periodStart} to ${parsed.periodEnd}, ${logs.length} shifts, ${hoursLabel(totalMinutes)} hours).`,
      );
    }

    const summaryLine = summaryParts.join(' ');

    const text = `Hi ${greetingName},

Please see the attached PDF file${includeInvoice && includeShiftLog ? 's' : ''} for this period.
${summaryLine}

Total pay for this period: ${toCurrency(totalPayCents, currencyCode)}

Thanks,
${senderName}`;

    const html = `<div style="font-family: Arial, sans-serif; color:#111827; line-height:1.6;">
      <p>Hi ${escapeHtml(greetingName)},</p>
      <p>Please see the attached PDF file${includeInvoice && includeShiftLog ? 's' : ''} for this period.</p>
      <p>${escapeHtml(summaryLine)}</p>
      <p><strong>Total pay for this period:</strong> ${escapeHtml(
        toCurrency(totalPayCents, currencyCode),
      )}</p>
      <p>Thanks,<br/>${escapeHtml(senderName)}</p>
    </div>`;

    const subject =
      parsed.reportFormat === 'invoice'
        ? `${senderName} invoice ${invoiceNumber}`
        : parsed.reportFormat === 'shift-log'
          ? `${senderName} biweekly shift log (${parsed.periodStart} to ${parsed.periodEnd})`
          : `${senderName} invoice + biweekly shift log (${parsed.periodStart} to ${parsed.periodEnd})`;

    const reportRows = logs.map((item) => ({
      date: item.workDate.toLocaleDateString(),
      hours: hoursLabel(item.minutesWorked),
      rate: toCurrency(item.hourlyRateCents, currencyCode),
      total: toCurrency(Math.round((item.minutesWorked / 60) * item.hourlyRateCents), currencyCode),
      note: item.note?.trim() || undefined,
    }));

    const commonPdfData = {
      invoiceNumber,
      invoiceDate,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      contractorName: senderName,
      clientName,
      serviceDescription,
      subtotal: toCurrency(subtotalCents, currencyCode),
      taxLabel,
      taxAmount:
        taxAmountCents > 0 ? toCurrency(taxAmountCents, currencyCode) : 'N/A (Not Registered)',
      totalDue: toCurrency(totalDueCents, currencyCode),
      paymentMethod,
      paymentEmail,
      paymentDueLabel,
      totalShifts: logs.length,
      totalHours: hoursLabel(totalMinutes),
      totalPay: toCurrency(totalPayCents, currencyCode),
      rows: reportRows,
    };

    const attachments: Array<{ filename: string; contentType: string; contentBase64: string }> = [];

    if (includeInvoice) {
      const invoicePdfBase64 = await createWorkLogReportPdf({
        reportFormat: 'invoice',
        ...commonPdfData,
      });

      attachments.push({
        filename: `${invoiceNumber}.pdf`,
        contentType: 'application/pdf',
        contentBase64: invoicePdfBase64,
      });
    }

    if (includeShiftLog) {
      const shiftPdfBase64 = await createWorkLogReportPdf({
        reportFormat: 'shift-log',
        ...commonPdfData,
      });

      attachments.push({
        filename: `biweekly-shift-summary-${parsed.periodStart}-to-${parsed.periodEnd}.pdf`,
        contentType: 'application/pdf',
        contentBase64: shiftPdfBase64,
      });
    }

    const sent = await sendEmail({
      to: parsed.employerEmail,
      subject,
      text,
      html,
      attachments,
    });

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send shift log email' }, { status: 500 });
    }

    return NextResponse.json(
      {
        sent: true,
        shifts: logs.length,
        totalMinutes,
        totalPayCents,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to send work log report:', error);
    return NextResponse.json({ error: 'Failed to send work log report' }, { status: 400 });
  }
}
