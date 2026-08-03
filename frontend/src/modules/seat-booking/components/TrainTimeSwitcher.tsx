'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Clock } from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { releaseSeatAction } from '@/modules/seat-booking/actions';

interface TrainTimeSwitcherProps {
  currentTrainId: string;
  currentScheduleId?: string;
  schedules: { id: string; trainId: string; value: string; label: string; origin: string; destination: string }[];
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('booking_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('booking_session_id', sid);
  }
  return sid;
}

export function TrainTimeSwitcher({ currentTrainId, currentScheduleId, schedules }: TrainTimeSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, resetBooking } = useBookingStore();

  const currentTime = searchParams.get('time') || '';
  const activeScheduleId = searchParams.get('scheduleId') || currentScheduleId || '';
  const date = searchParams.get('date') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const routeSchedules = schedules.filter((schedule) => schedule.origin === from && schedule.destination === to);
  const visibleSchedules = routeSchedules.length > 0 ? routeSchedules : schedules;

  const handleTimeChange = async (schedule: TrainTimeSwitcherProps['schedules'][number]) => {
    if (schedule.id === activeScheduleId) return;

    const sessionId = getSessionId();
    if (cart.length > 0 && sessionId) {
      await Promise.allSettled(
        cart.map((item) => releaseSeatAction({ trainId: item.trainId, seatId: item.seatId, date, sessionId }))
      );
      resetBooking();
    }

    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('time', schedule.value);
    params.set('scheduleId', schedule.id);

    router.push(`/seats/${schedule.trainId || currentTrainId}?${params.toString()}#booking-workspace`);
  };

  if (schedules.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0">
        <Clock className="w-3.5 h-3.5" />
        <span>Departure</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleSchedules.map((sch) => {
          const isActive = sch.id === activeScheduleId || (!activeScheduleId && sch.value === currentTime);
          return (
            <button
              key={sch.id}
              onClick={() => handleTimeChange(sch)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/80 hover:text-white border border-slate-700/40'
              }`}
            >
              {sch.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
