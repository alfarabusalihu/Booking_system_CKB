import QRCode from 'qrcode';
import type { SeatBooking } from '@/modules/core/store';

export interface TicketData {
  bookingId: string;
  from: string;
  to: string;
  date: string;
  passengerName: string;
  passengerEmail: string;
  seats: SeatBooking[];
  totalPaid: number;
}

function escapePdfText(value: string) {
  return value.replace(/[\\()]/g, '\\$&');
}

function buildQrPdfCommands(payload: string): string {
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
  const { size, data } = qr.modules;
  const cellSize = 3;
  const originX = 400;
  const originY = 560;
  const commands: string[] = ['0.08 w', '0 0 0 rg'];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!data[row * size + col]) continue;
      const x = originX + col * cellSize;
      const y = originY + (size - row - 1) * cellSize;
      commands.push(`${x} ${y} ${cellSize} ${cellSize} re f`);
    }
  }

  return commands.join('\n');
}

function buildPdf(lines: string[], qrCommands: string): string {
  const textCommands = lines
    .map((line, index) => `BT /F1 11 Tf 72 ${720 - index * 22} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n');
  const pageContent = `${textCommands}\n${qrCommands}`;

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${pageContent.length} >> stream\n${pageContent}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 200,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}

export async function downloadTicketPdf(booking: TicketData): Promise<void> {
  const qrPayload = JSON.stringify({
    ref: booking.bookingId,
    from: booking.from,
    to: booking.to,
    date: booking.date,
    seats: booking.seats.map((s) => s.seatNo),
  });

  const lines = [
    'Sri Lanka Railways E-Ticket',
    `Booking Ref: ${booking.bookingId}`,
    `Passenger: ${booking.passengerName}`,
    `Email: ${booking.passengerEmail}`,
    `Route: ${booking.from} to ${booking.to}`,
    `Travel Date: ${booking.date}`,
    `Seats: ${booking.seats.map((seat) => `${seat.seatNo} (${seat.class})`).join(', ')}`,
    `Total Paid: LKR ${booking.totalPaid.toLocaleString()}`,
    'Status: Paid and issued',
    'Scan QR code for gate validation',
  ];

  const qrCommands = buildQrPdfCommands(qrPayload);
  const pdfContent = buildPdf(lines, qrCommands);
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${booking.bookingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  console.log('[CHECKOUT] PDF ticket downloaded', { bookingId: booking.bookingId });
}
