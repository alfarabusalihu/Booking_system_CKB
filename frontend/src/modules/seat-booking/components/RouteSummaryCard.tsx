'use client';

import Link from 'next/link';
import { ArrowLeft, Armchair, CheckCircle2, Lock } from 'lucide-react';
import type { ScheduleOption } from '@/modules/core/store';
import { TrainTimeSwitcher } from '@/modules/seat-booking/components/TrainTimeSwitcher';
import { useBookingStore } from '@/modules/core/store';

interface RouteSummaryCardProps {
  currentTrainId: string;
  currentScheduleId?: string;
  from: string;
  to: string;
  date: string;
  schedules: ScheduleOption[];
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
}

export function RouteSummaryCard({
  currentTrainId,
  currentScheduleId,
  from,
  to,
  schedules,
  totalSeats,
  availableSeats,
  bookedSeats,
}: RouteSummaryCardProps) {
  const stations = useBookingStore((state) => state.stations);
  const seatStats = useBookingStore((state) => state.seatStats);
  const stationLabel = (code: string) => stations.find((station) => station.code === code)?.name ?? code;
  const pathTitle = `${stationLabel(from)} to ${stationLabel(to)}`;
  const displayedTotal = seatStats.total || totalSeats;
  const displayedAvailable = seatStats.total ? seatStats.available : availableSeats;
  const displayedBooked = seatStats.total ? seatStats.booked : bookedSeats;
  const stats = [
    { label: 'Total', value: displayedTotal, icon: Armchair, color: 'text-white', bg: 'bg-slate-800/70' },
    { label: 'Available', value: displayedAvailable, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Booked', value: displayedBooked, icon: Lock, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="w-full glass-panel-compact p-3 sm:p-4 transition-card animate-panelIn">
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              title="Back to Search"
              aria-label="Back to search"
              className="inline-flex items-center justify-center w-9 h-9 shrink-0 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 rounded-xl border border-slate-700/60 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
            </Link>

            <h1 className="text-sm sm:text-base font-black text-white truncate min-w-0">
              {pathTitle}
            </h1>
          </div>

          <TrainTimeSwitcher currentTrainId={currentTrainId} currentScheduleId={currentScheduleId} schedules={schedules} />
        </div>

        <div className="grid grid-cols-3 gap-2 xl:w-[310px] shrink-0">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5 min-w-0"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className={`w-5 h-5 rounded-md ${stat.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3 h-3 ${stat.color}`} />
                  </span>
                  <span className="truncate">{stat.label}</span>
                </div>
                <p className={`mt-1 text-lg font-black leading-none ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
