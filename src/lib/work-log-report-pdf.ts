import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';

type ShiftLogRow = {
  date: string;
  hours: string;
  rate: string;
  total: string;
  note?: string;
};

type WorkLogReportPdfInput = {
  reportFormat: 'invoice' | 'shift-log' | 'both';
  invoiceNumber: string;
  invoiceDate: string;
  periodStart: string;
  periodEnd: string;
  contractorName: string;
  clientName: string;
  serviceDescription: string;
  subtotal: string;
  taxLabel: string;
  taxAmount: string;
  totalDue: string;
  paymentMethod: string;
  paymentEmail: string;
  paymentDueLabel: string;
  totalShifts: number;
  totalHours: string;
  totalPay: string;
  rows: ShiftLogRow[];
};

function drawLine(
  page: PDFPage,
  y: number,
  width: number,
  margin: number,
  color = rgb(0.85, 0.85, 0.85),
) {
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    color,
    thickness: 1,
  });
}

export async function createWorkLogReportPdf(input: WorkLogReportPdfInput): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const margin = 44;
  let cursorY = height - margin;

  function nextPage() {
    page = pdfDoc.addPage([612, 792]);
    cursorY = height - margin;
  }

  function ensureSpace(lines = 1) {
    if (cursorY - lines * 18 < margin) {
      nextPage();
    }
  }

  function drawText(label: string, value = '', valueX = 220) {
    ensureSpace();
    page.drawText(label, {
      x: margin,
      y: cursorY,
      size: 11,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    if (value) {
      page.drawText(value, {
        x: valueX,
        y: cursorY,
        size: 11,
        font: regular,
        color: rgb(0.15, 0.15, 0.15),
      });
    }
    cursorY -= 20;
  }

  function drawRightText(text: string, rightX: number, y: number, size = 10, isBold = false) {
    const font = isBold ? bold : regular;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: rightX - textWidth,
      y,
      size,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
  }

  function wrapText(text: string, maxWidth: number, size = 9): string[] {
    if (!text.trim()) {
      return [];
    }

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (regular.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  if (input.reportFormat === 'invoice' || input.reportFormat === 'both') {
    page.drawText('Invoice', {
      x: margin,
      y: cursorY,
      size: 26,
      font: bold,
      color: rgb(0.08, 0.08, 0.08),
    });
    cursorY -= 28;

    drawLine(page, cursorY, width, margin);
    cursorY -= 18;

    drawText('Invoice #:', input.invoiceNumber);
    drawText('Invoice Date:', input.invoiceDate);
    drawText('Work Period:', `${input.periodStart} - ${input.periodEnd}`);
    drawText('Contractor:', input.contractorName);
    drawText('Client:', input.clientName);

    cursorY -= 8;
    page.drawText('Services Provided', {
      x: margin,
      y: cursorY,
      size: 18,
      font: bold,
      color: rgb(0.08, 0.08, 0.08),
    });
    cursorY -= 24;

    page.drawText('Description', { x: margin, y: cursorY, size: 11, font: bold });
    page.drawText('Hours', { x: 320, y: cursorY, size: 11, font: bold });
    page.drawText('Amount', { x: 500, y: cursorY, size: 11, font: bold });
    cursorY -= 12;
    drawLine(page, cursorY, width, margin);
    cursorY -= 18;

    page.drawText(input.serviceDescription, { x: margin, y: cursorY, size: 11, font: regular });
    page.drawText(input.totalHours, { x: 320, y: cursorY, size: 11, font: regular });
    page.drawText(input.subtotal, { x: 500, y: cursorY, size: 11, font: regular });

    cursorY -= 20;
    drawLine(page, cursorY, width, margin);
    cursorY -= 24;

    drawText('Subtotal', input.subtotal, 500);
    drawText(input.taxLabel, input.taxAmount, 500);
    drawText('Total Due', input.totalDue, 500);

    cursorY -= 10;
    drawText('Payment Method:', input.paymentMethod);
    drawText('Payment Email:', input.paymentEmail);
    drawText('Payment Due:', input.paymentDueLabel);

    cursorY -= 28;
  }

  if (input.reportFormat === 'shift-log' || input.reportFormat === 'both') {
    ensureSpace(8);

    const idxX = margin;
    const dateX = margin + 24;
    const dateRight = 220;
    const hoursRight = 298;
    const rateRight = 390;
    const totalRight = width - margin;
    const noteMaxWidth = totalRight - dateX;

    function drawShiftHeader() {
      const headerY = cursorY;

      page.drawText('#', {
        x: idxX,
        y: headerY - 2,
        size: 10,
        font: bold,
        color: rgb(0.12, 0.12, 0.12),
      });
      page.drawText('Date', {
        x: dateX,
        y: headerY - 2,
        size: 10,
        font: bold,
        color: rgb(0.12, 0.12, 0.12),
      });
      drawRightText('Hours', hoursRight, headerY - 2, 10, true);
      drawRightText('Rate', rateRight, headerY - 2, 10, true);
      drawRightText('Total', totalRight, headerY - 2, 10, true);

      cursorY -= 16;
      drawLine(page, cursorY, width, margin, rgb(0.87, 0.89, 0.92));
      cursorY -= 16;
    }

    page.drawText('Biweekly Shift Log', {
      x: margin,
      y: cursorY,
      size: 21,
      font: bold,
      color: rgb(0.08, 0.08, 0.08),
    });
    cursorY -= 24;
    page.drawText(`Period: ${input.periodStart} - ${input.periodEnd}`, {
      x: margin,
      y: cursorY,
      size: 11,
      font: regular,
      color: rgb(0.15, 0.15, 0.15),
    });
    cursorY -= 16;
    drawLine(page, cursorY, width, margin);
    cursorY -= 14;

    drawShiftHeader();
    input.rows.forEach((row, index) => {
      const noteLines = row.note ? wrapText(`Note: ${row.note}`, noteMaxWidth, 9) : [];
      const requiredLines = 2 + Math.max(0, noteLines.length);

      if (cursorY - requiredLines * 12 < margin + 30) {
        nextPage();
        page.drawText('Biweekly Shift Log (continued)', {
          x: margin,
          y: cursorY,
          size: 15,
          font: bold,
          color: rgb(0.1, 0.1, 0.1),
        });
        cursorY -= 14;
        drawShiftHeader();
      }

      page.drawText(String(index + 1), { x: idxX, y: cursorY, size: 10, font: regular });
      page.drawText(row.date, { x: dateX, y: cursorY, size: 10, font: regular });
      drawRightText(row.hours, hoursRight, cursorY, 10, false);
      drawRightText(row.rate, rateRight, cursorY, 10, false);
      drawRightText(row.total, totalRight, cursorY, 10, false);
      cursorY -= 16;

      for (const line of noteLines) {
        page.drawText(line, {
          x: dateX,
          y: cursorY,
          size: 9,
          font: regular,
          color: rgb(0.38, 0.38, 0.38),
        });
        cursorY -= 16;
      }

      drawLine(page, cursorY, width, margin, rgb(0.9, 0.91, 0.93));
      cursorY -= 16;
    });

    ensureSpace(7);
    drawLine(page, cursorY, width, margin);
    cursorY -= 16;

    page.drawText('Summary', {
      x: margin,
      y: cursorY,
      size: 11,
      font: bold,
      color: rgb(0.14, 0.14, 0.14),
    });
    cursorY -= 16;
    page.drawText(`Total Shifts: ${input.totalShifts}`, {
      x: margin,
      y: cursorY,
      size: 10,
      font: regular,
    });
    page.drawText(`Total Hours: ${input.totalHours}`, {
      x: margin + 180,
      y: cursorY,
      size: 10,
      font: regular,
    });
    page.drawText(`Total Pay: ${input.totalPay}`, {
      x: margin + 350,
      y: cursorY,
      size: 10,
      font: bold,
    });
    cursorY -= 16;
    drawLine(page, cursorY, width, margin);
    cursorY -= 10;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes).toString('base64');
}
