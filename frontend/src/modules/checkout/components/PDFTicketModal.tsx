'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, CheckCircle2, Train, X } from 'lucide-react';
import type { TicketData } from '@/modules/checkout/utils/ticketPdf';
import { downloadTicketPdf, generateQrDataUrl } from '@/modules/checkout/utils/ticketPdf';
import { useBookingStore } from '@/modules/core/store';

interface PDFTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: TicketData;
}

export function PDFTicketModal({ isOpen, onClose, bookingData }: PDFTicketModalProps) {
  const router = useRouter();
  const { completeBooking } = useBookingStore();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const payload = JSON.stringify({
      ref: bookingData.bookingId,
      from: bookingData.from,
      to: bookingData.to,
      date: bookingData.date,
      seats: bookingData.seats.map((s) => s.seatNo),
    });

    void generateQrDataUrl(payload).then(setQrDataUrl);
  }, [isOpen, bookingData]);

  if (!isOpen) return null;

  const finishAndRedirect = () => {
    console.log('[CHECKOUT] Completing booking session and redirecting to home');
    completeBooking();
    onClose();
    router.push('/');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadTicketPdf(bookingData);
      finishAndRedirect();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    finishAndRedirect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white">

        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-all cursor-pointer"
          aria-label="Close ticket modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Booking Confirmed
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Official E-Ticket</h2>
          <p className="text-slate-400 text-xs mt-1">
            Ref #: <code className="text-indigo-300 font-mono">{bookingData.bookingId}</code>
          </p>
        </div>

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

          <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
            <div className="space-y-4">
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
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Ticket QR code for gate validation"
                  className="w-24 h-24 rounded-xl border border-slate-700 bg-white p-1"
                />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Scan at Gate</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
            <span className="text-slate-400 font-bold">Total Amount Paid</span>
            <span className="text-emerald-400 font-black text-base">LKR {bookingData.totalPaid.toLocaleString()}</span>
          </div>

        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Generating PDF…' : 'Download PDF Ticket'}</span>
          </button>
          <button
            onClick={handleClose}
            className="px-5 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
