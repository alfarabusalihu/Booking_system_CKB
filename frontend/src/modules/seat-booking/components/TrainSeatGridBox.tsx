'use client';

import { useState } from 'react';
import { Armchair, Lock, Check, Loader2 } from 'lucide-react';
import type { SeatData } from '@/modules/search/api';

export type ViewMode = 'ALL' | 'BOOKED_ONLY';

interface TrainSeatGridBoxProps {
  seats: SeatData[];
  selectedSeatIds: string[];
  pendingSeatIds?: string[];
  sessionId: string;
  actionSeatId: string | null;
  onSeatClick: (seat: SeatData) => void;
}

export function TrainSeatGridBox({
  seats,
  selectedSeatIds,
  pendingSeatIds = [],
  sessionId,
  actionSeatId,
  onSeatClick,
}: TrainSeatGridBoxProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('ALL');

  const firstClassSeats = seats.filter((s) => s.class === '1st Class');
  const secondClassSeats = seats.filter((s) => s.class === '2nd Class');

  const renderSeatGrid = (seatList: SeatData[]) => (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full">
      {seatList.map((seat, index) => {
        const isSelectedInCart = selectedSeatIds.includes(seat.id);
        const isPendingSelection = pendingSeatIds.includes(seat.id) && !isSelectedInCart;
        const isLockedByOther = seat.isLocked && seat.lockedBySessionId !== sessionId;
        const isProcessing = actionSeatId === seat.id;
        const isAisleRight = index % 4 === 1;
        const isDimmed = viewMode === 'BOOKED_ONLY' && !isLockedByOther && !isSelectedInCart;

        let stateClasses =
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400/60 shadow-sm';

        if (isLockedByOther) {
          stateClasses = 'bg-rose-500/15 border-rose-500/30 text-rose-400 cursor-not-allowed';
        } else if (isSelectedInCart) {
          stateClasses =
            'bg-indigo-600 border-indigo-300 text-white shadow-lg shadow-indigo-600/40 font-bold ring-2 ring-indigo-300/40';
        } else if (isPendingSelection) {
          stateClasses =
            'bg-amber-500/20 border-amber-300/70 text-amber-100 shadow-lg shadow-amber-500/20 font-bold ring-2 ring-amber-300/30';
        } else if (isDimmed) {
          stateClasses = 'bg-slate-900/30 border-slate-800/40 text-slate-700 opacity-30 hover:opacity-70';
        }

        return (
          <button
            key={seat.id}
            onClick={() => onSeatClick(seat)}
            disabled={isLockedByOther || isProcessing}
            aria-pressed={isSelectedInCart || isPendingSelection}
            title={
              isLockedByOther
                ? `Seat ${seat.seatNo} is occupied for this route segment`
                : isPendingSelection
                  ? `Seat ${seat.seatNo} is selected pending login`
                : `Seat ${seat.seatNo} (${seat.class})`
            }
            className={`h-12 rounded-lg border flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer ${
              isAisleRight ? 'mr-2' : ''
            } ${stateClasses}`}
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : isSelectedInCart ? (
              <>
                <Check className="w-3.5 h-3.5 mb-0.5 text-white" />
                <span className="text-[10px] leading-none">{seat.seatNo}</span>
              </>
            ) : isPendingSelection ? (
              <>
                <Check className="w-3.5 h-3.5 mb-0.5 text-amber-100" />
                <span className="text-[10px] leading-none">{seat.seatNo}</span>
              </>
            ) : isLockedByOther ? (
              <>
                <Lock className="w-3 h-3 mb-0.5 text-rose-400" />
                <span className="text-[9px] leading-none font-bold">{seat.seatNo}</span>
              </>
            ) : (
              <>
                <Armchair className={`w-3.5 h-3.5 mb-0.5 ${isDimmed ? 'text-slate-600' : 'text-emerald-400'}`} />
                <span className="text-[10px] leading-none font-semibold">{seat.seatNo}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="w-full h-[640px] lg:h-[min(820px,calc(100vh-104px))] bg-slate-900/70 border border-slate-700/60 rounded-lg shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden transition-card">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="truncate">Carriage Seat Layout</span>
            </h2>
            <p className="text-slate-400 text-[11px]">Select seats to reserve</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('BOOKED_ONLY')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'BOOKED_ONLY' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Booked
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 py-2.5 px-3 rounded-lg border border-slate-800 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Armchair className="w-2 h-2 text-emerald-400" />
            </div>
            <span className="text-slate-300 truncate">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <Lock className="w-2 h-2 text-rose-400" />
            </div>
            <span className="text-rose-400 truncate">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-indigo-600 border border-indigo-400 flex items-center justify-center">
              <Check className="w-2 h-2 text-white" />
            </div>
            <span className="text-indigo-300 truncate">Selected</span>
          </div>
        </div>
      </div>

      <div className="carriage-scroll flex-1 overflow-y-auto p-4 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              1st Class AC (LKR 1,200)
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">20 Seats</span>
          </div>
          {renderSeatGrid(firstClassSeats)}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              2nd Class Reserved (LKR 650)
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">40 Seats</span>
          </div>
          {renderSeatGrid(secondClassSeats)}
        </div>
      </div>
    </div>
  );
}
