'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SeatExpiryTimerProps {
  expiresAt: Date | string;
  onExpiry?: () => void;
}

export function SeatExpiryTimer({ expiresAt, onExpiry }: SeatExpiryTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
      const now = new Date();
      const remaining = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
      return Math.max(0, remaining);
    };

    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        if (onExpiry) onExpiry();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpiry]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isLowTime = remainingSeconds < 120; // Less than 2 minutes
  const isCritical = remainingSeconds < 60; // Less than 1 minute

  if (remainingSeconds === 0) {
    return (
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Seat hold expired. Please select seats again.</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
      isCritical 
        ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
        : isLowTime
        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        : 'bg-slate-900/50 border-slate-800 text-slate-300'
    }`}>
      <Clock className={`w-4 h-4 shrink-0 ${isCritical ? 'animate-pulse' : ''}`} />
      <span className="flex-1">
        {isCritical ? 'Hurry! ' : isLowTime ? 'Time running out: ' : 'Seat hold expires in: '}
      </span>
      <span className="font-mono text-base">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
