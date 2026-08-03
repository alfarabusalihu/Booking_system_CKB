'use client';

import { Download, CheckCircle2, Train, X } from 'lucide-react';
import type { SeatBooking } from '@/modules/core/store';

interface PDFTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    bookingId: string;
    from: string;
    to: string;
    date: string;
    passengerName: string;
    passengerEmail: string;
    seats: SeatBooking[];
    totalPaid: number;
  };
}

export function PDFTicketModal({ isOpen, onClose, bookingData }: PDFTicketModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const lines = [
      'Sri Lanka Railways E-Ticket',
      `Booking Ref: ${bookingData.bookingId}`,
      `Passenger: ${bookingData.passengerName}`,
      `Email: ${bookingData.passengerEmail}`,
      `Route: ${bookingData.from} to ${bookingData.to}`,
      `Travel Date: ${bookingData.date}`,
      `Seats: ${bookingData.seats.map((seat) => `${seat.seatNo} (${seat.class})`).join(', ')}`,
      `Total Paid: LKR ${bookingData.totalPaid.toLocaleString()}`,
      'Status: Paid and issued',
    ];
    const escapePdfText = (value: string) => value.replace(/[\\()]/g, '\\$&');
    const textCommands = lines
      .map((line, index) => `BT /F1 12 Tf 72 ${740 - index * 24} Td (${escapePdfText(line)}) Tj ET`)
      .join('\n');
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${textCommands.length} >> stream\n${textCommands}\nendstream endobj`,
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

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${bookingData.bookingId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Booking Confirmed
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Official E-Ticket</h2>
          <p className="text-slate-400 text-xs mt-1">Ref #: <code className="text-indigo-300 font-mono">{bookingData.bookingId}</code></p>
        </div>

        {/* Printable Ticket Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs font-medium">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold">
              <Train className="w-4 h-4 text-emerald-400" />
              <span>Sri Lanka Railways</span>
            </div>
            <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-black">
              PAID & ISSUED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Passenger</p>
              <p className="text-white font-bold text-sm mt-0.5">{bookingData.passengerName}</p>
              <p className="text-slate-400 text-[11px]">{bookingData.passengerEmail}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Travel Date</p>
              <p className="text-amber-300 font-bold text-sm mt-0.5">{bookingData.date}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Route Path</p>
            <p className="text-white font-black text-base">
              {bookingData.from} ➔ {bookingData.to}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-slate-500 text-[10px] uppercase font-bold mb-1.5">Reserved Seats</p>
            <div className="flex flex-wrap gap-2">
              {bookingData.seats.map((s) => (
                <span
                  key={s.seatId}
                  className="bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 px-2.5 py-1 rounded-xl text-xs font-bold"
                >
                  {s.seatNo} ({s.class})
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
            <span className="text-slate-400 font-bold">Total Amount Paid</span>
            <span className="text-emerald-400 font-black text-base">LKR {bookingData.totalPaid.toLocaleString()}</span>
          </div>

        </div>

        {/* CTAs */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDownload}
            className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
