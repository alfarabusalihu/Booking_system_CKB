'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Ticket, Download, Home } from 'lucide-react';

interface PaymentSuccessAnimationProps {
  bookingRef?: string;
  onComplete?: () => void;
}

export function PaymentSuccessAnimation({ bookingRef, onComplete }: PaymentSuccessAnimationProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2500),
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 4000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="text-center py-12 space-y-6">
      {/* Success Icon with Animation */}
      <div className="relative inline-flex items-center justify-center">
        <div className={`absolute w-32 h-32 rounded-full bg-emerald-500/20 ${step >= 0 ? 'animate-ping' : ''}`} />
        <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50">
          <CheckCircle className={`w-12 h-12 text-white ${step >= 0 ? 'animate-bounce' : ''}`} />
        </div>
      </div>

      {/* Success Message */}
      <div className={`space-y-2 transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h2 className="text-3xl font-black text-white">Payment Successful!</h2>
        <p className="text-slate-400 text-sm">Your booking has been confirmed</p>
        {bookingRef && (
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mt-2">
            <p className="text-xs text-emerald-400 font-bold">Booking Reference</p>
            <p className="text-xl font-black text-white font-mono">{bookingRef}</p>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className={`space-y-3 transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="font-bold">Payment Processed</span>
          </div>
        </div>

        <div className={`flex items-center justify-center gap-3 text-sm transition-all duration-300 ${step >= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${step >= 2 ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-slate-800 border border-slate-700'}`}>
            {step >= 2 ? <CheckCircle className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
          </div>
          <span className="font-bold">Seats Reserved</span>
        </div>

        <div className={`flex items-center justify-center gap-3 text-sm transition-all duration-300 ${step >= 3 ? 'text-emerald-400' : 'text-slate-600'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${step >= 3 ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-slate-800 border border-slate-700'}`}>
            {step >= 3 ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          </div>
          <span className="font-bold">Generating Ticket...</span>
        </div>
      </div>

      {/* Call to Action */}
      {step >= 3 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
            <p className="text-indigo-300 text-xs font-bold flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Your ticket will download automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
