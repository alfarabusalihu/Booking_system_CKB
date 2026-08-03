'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSeats, type SeatData } from '@/modules/search/api';
import { useBookingStore, type ScheduleOption, type Station } from '@/modules/core/store';
import { holdSeatAction, releaseSeatAction } from '@/modules/seat-booking/actions';
import { TrainSeatGridBox } from './TrainSeatGridBox';
import { ContextualLeftPanel } from './ContextualLeftPanel';
import { RouteSummaryCard } from './RouteSummaryCard';
import { Loader2, AlertCircle } from 'lucide-react';

interface SeatMapContainerProps {
  trainId: string;
  scheduleId?: string;
  date: string;
  from: string;
  to: string;
  schedules: ScheduleOption[];
  stations: Station[];
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  initialSeats: SeatData[];
  onSeatsLoaded?: (total: number, available: number, booked: number) => void;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  let sid = sessionStorage.getItem('booking_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('booking_session_id', sid);
  }
  return sid;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function SeatMapContainer({
  trainId,
  scheduleId,
  date,
  from,
  to,
  schedules,
  stations,
  totalSeats,
  initialSeats,
  onSeatsLoaded,
}: SeatMapContainerProps) {
  const [seats, setSeats] = useState<SeatData[]>(initialSeats);
  const [loading, setLoading] = useState(initialSeats.length === 0);
  const [actionSeatId, setActionSeatId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guest interaction state
  const [pendingSeats, setPendingSeats] = useState<SeatData[]>([]);
  const [showLeftAuthOverride, setShowLeftAuthOverride] = useState(false);
  const contextualPanelRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const { cart, user, addSeat, removeSeat, setSeatStats, setStations } = useBookingStore();
  const sessionId = getSessionId();
  const activeCart = cart.filter(
    (item) => item.trainId === trainId && (!scheduleId || item.scheduleId === scheduleId)
  );

  const loadSeats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSeats(trainId, date, from, to, scheduleId);
      setSeats(data);

      const total = data.length;
      const booked = data.filter((s) => s.isLocked).length;
      const available = total - booked;
      setSeatStats({ total, available, booked });

      if (onSeatsLoaded) {
        onSeatsLoaded(total, available, booked);
      }
    } catch (e: unknown) {
      setErrorMessage(getErrorMessage(e, 'Failed to load seat layout.'));
    } finally {
      setLoading(false);
    }
  }, [date, from, onSeatsLoaded, scheduleId, setSeatStats, to, trainId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSeats();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadSeats]);

  useEffect(() => {
    if (stations.length > 0) setStations(stations);
  }, [setStations, stations]);

  useEffect(() => {
    const total = seats.length || totalSeats;
    const booked = seats.filter((seat) => seat.isLocked).length;
    setSeatStats({ total, available: total - booked, booked });
  }, [seats, setSeatStats, totalSeats]);

  useEffect(() => {
    if (window.location.hash !== '#booking-workspace') return;
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }, []);

  const lockSeatForSession = async (seat: SeatData) => {
    setActionSeatId(seat.id);
    setErrorMessage(null);
    try {
      await holdSeatAction({ trainId, scheduleId, seatId: seat.id, date, from, to, sessionId });
      const price = seat.class === '1st Class' ? 1200 : 650;
      addSeat({
        trainId,
        scheduleId,
        travelDate: date,
        seatId: seat.id,
        seatNo: seat.seatNo,
        class: seat.class,
        price,
      });
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, isLocked: true, lockedBySessionId: sessionId } : s))
      );
    } catch (e: unknown) {
      setErrorMessage(getErrorMessage(e, 'Failed to hold seat.'));
    } finally {
      setActionSeatId(null);
    }
  };

  const handleSeatClick = async (seat: SeatData) => {
    setErrorMessage(null);
    const isSelectedInCart = activeCart.some((item) => item.seatId === seat.id);

    // Case 1: Unselect seat
    if (isSelectedInCart) {
      setActionSeatId(seat.id);
      try {
        await releaseSeatAction({ trainId, seatId: seat.id, date, sessionId });
        removeSeat(seat.id);
        setSeats((prev) =>
          prev.map((s) => (s.id === seat.id ? { ...s, isLocked: false, lockedBySessionId: null } : s))
        );
      } catch (e: unknown) {
        setErrorMessage(getErrorMessage(e, 'Failed to release seat.'));
      } finally {
        setActionSeatId(null);
      }
      return;
    }

    // Case 2: Locked by another user
    if (seat.isLocked && seat.lockedBySessionId !== sessionId) {
      setErrorMessage(`Seat ${seat.seatNo} is occupied for this route segment.`);
      return;
    }

    // Case 3: Limit 6 seats
    if (activeCart.length >= 6) {
      setErrorMessage('Maximum 6 seats allowed per reservation session.');
      return;
    }

    // Case 4: Unauthenticated user clicks seat -> reveal inline left auth panel
    if (!user) {
      setPendingSeats((prev) => {
        if (prev.some((pending) => pending.id === seat.id)) {
          return prev.filter((pending) => pending.id !== seat.id);
        }
        if (prev.length + activeCart.length >= 6) {
          setErrorMessage('Maximum 6 seats allowed per reservation session.');
          return prev;
        }
        return [...prev, seat];
      });
      setShowLeftAuthOverride(true);
      window.setTimeout(() => {
        contextualPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }

    // Case 5: Authenticated user locks seat
    await lockSeatForSession(seat);
  };

  const handleAuthSuccess = async () => {
    if (pendingSeats.length > 0) {
      const seatsToLock = pendingSeats;
      setPendingSeats([]);
      setShowLeftAuthOverride(false);
      for (const seat of seatsToLock) {
        await lockSeatForSession(seat);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading real-time carriage layout & bitmask status…</p>
      </div>
    );
  }

  const selectedSeatIds = activeCart.map((item) => item.seatId);
  const pendingSeatIds = pendingSeats.map((seat) => seat.id);
  const currentTotalSeats = seats.length || totalSeats;
  const currentBookedSeats = seats.filter((seat) => seat.isLocked).length;
  const currentAvailableSeats = currentTotalSeats - currentBookedSeats;

  return (
    <div id="booking-workspace" ref={workspaceRef} className="w-full flex flex-col gap-6 scroll-mt-24">

      {/* Error alert banner */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ASYMMETRIC SPLIT PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 w-full items-start">
        
        {/* LEFT PANEL: Compact route stats plus contextual auth / checkout / rules workspace */}
        <div ref={contextualPanelRef} className="w-full min-w-0 space-y-6">
          <RouteSummaryCard
            currentTrainId={trainId}
            currentScheduleId={scheduleId}
            from={from}
            to={to}
            date={date}
            schedules={schedules}
            totalSeats={currentTotalSeats}
            availableSeats={currentAvailableSeats}
            bookedSeats={currentBookedSeats}
          />

          <div id="booking-context">
            <ContextualLeftPanel
              pendingSeatNos={pendingSeats.map((seat) => seat.seatNo)}
              showAuthOverride={showLeftAuthOverride}
              onClearPendingSeat={() => setPendingSeats([])}
              onAuthComplete={handleAuthSuccess}
              from={from}
              to={to}
              date={date}
              trainId={trainId}
              scheduleId={scheduleId}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Fixed-height train carriage box */}
        <div className="w-full lg:sticky lg:top-[84px] lg:self-start">
          <TrainSeatGridBox
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            pendingSeatIds={pendingSeatIds}
            sessionId={sessionId}
            actionSeatId={actionSeatId}
            onSeatClick={handleSeatClick}
          />
        </div>

      </div>
    </div>
  );
}
