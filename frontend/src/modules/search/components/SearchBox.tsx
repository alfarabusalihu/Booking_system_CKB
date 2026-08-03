'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Calendar, Clock, ArrowRightLeft, Train, Loader2, ChevronDown } from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { fetchStations, fetchSchedules } from '@/modules/search/api';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to connect to the backend.';
}

export function SearchBox() {
  const router = useRouter();

  const { searchQuery, setSearchQuery, stations, setStations, schedules, setSchedules } = useBookingStore();
  const { origin, destination, date, time } = searchQuery;

  const [stationsLoading, setStationsLoading] = useState(false);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [autoSearchCountdown, setAutoSearchCountdown] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<'origin' | 'destination' | 'date' | 'time', boolean>>({
    origin: false,
    destination: false,
    date: false,
    time: false,
  });
  const isInitialMount = useRef(true);
  const userHasInteracted = useRef(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const visibleSchedules = useMemo(() => {
    const routeSchedules = schedules.filter((schedule) => schedule.origin === origin && schedule.destination === destination);
    return origin && destination ? routeSchedules : schedules;
  }, [destination, origin, schedules]);
  const originOptions = useMemo(() => {
    const origins = new Set(schedules.map((schedule) => schedule.origin));
    return stations.filter((station) => origins.has(station.code));
  }, [schedules, stations]);
  const destinationOptions = useMemo(() => {
    if (!origin) return [];
    const destinations = new Set(
      schedules.filter((schedule) => schedule.origin === origin).map((schedule) => schedule.destination)
    );
    return stations.filter((station) => destinations.has(station.code));
  }, [origin, schedules, stations]);
  const reverseRouteExists = useMemo(
    () => schedules.some((schedule) => schedule.origin === destination && schedule.destination === origin),
    [destination, origin, schedules]
  );

  const selectedSchedule = useMemo(
    () => visibleSchedules.find((schedule) => schedule.value === time) ?? visibleSchedules[0] ?? null,
    [time, visibleSchedules]
  );
  const validationErrors = {
    origin: !origin ? 'Choose an origin station.' : '',
    destination: !destination
      ? 'Choose a destination station.'
      : origin === destination
        ? 'Origin and destination must be different.'
        : '',
    date: !date ? 'Choose a travel date.' : date < today ? 'Travel date cannot be in the past.' : '',
    time: origin && destination && visibleSchedules.length === 0
      ? 'No departures are available for this route.'
      : !time
        ? 'Choose a departure time.'
        : '',
  };
  const hasSearchErrors = Object.values(validationErrors).some(Boolean);

  const markTouched = (field: keyof typeof touchedFields) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const shouldShowError = (field: keyof typeof touchedFields) => touchedFields[field] && validationErrors[field];

  const loadData = useCallback(async () => {
    setDataError(null);
    try {
      setStationsLoading(true);
      const stationData = await fetchStations();
      setStations(stationData);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[SEARCH_MODULE] Failed to load stations:', message);
      setDataError(message);
    } finally {
      setStationsLoading(false);
    }

    try {
      setSchedulesLoading(true);
      const scheduleData = await fetchSchedules();
      setSchedules(scheduleData);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[SEARCH_MODULE] Failed to load schedules:', message);
      setDataError((prev) => prev ?? message);
    } finally {
      setSchedulesLoading(false);
    }
  }, [setSchedules, setStations]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    if (!origin || !destination) return;
    if (visibleSchedules.length === 0) {
      if (time) setSearchQuery({ time: '' });
      return;
    }
    if (!visibleSchedules.some((schedule) => schedule.value === time)) {
      setSearchQuery({ time: visibleSchedules[0].value });
    }
  }, [destination, origin, setSearchQuery, time, visibleSchedules]);

  const executeSearch = useCallback(() => {
    if (hasSearchErrors || !selectedSchedule) {
      setTouchedFields({ origin: true, destination: true, date: true, time: true });
      return;
    }
    setIsNavigating(true);

    const params = new URLSearchParams({
      date,
      time: selectedSchedule.value,
      scheduleId: selectedSchedule.id,
      from: origin,
      to: destination,
    });

    router.push(`/seats/${selectedSchedule.trainId}?${params.toString()}#booking-workspace`);
  }, [date, destination, hasSearchErrors, origin, router, selectedSchedule]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!userHasInteracted.current) return;
    if (hasSearchErrors || !selectedSchedule) return;

    const countdownStart = window.setTimeout(() => setAutoSearchCountdown(3), 0);
    const countdownInterval = setInterval(() => {
      setAutoSearchCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    const timer = setTimeout(() => {
      clearInterval(countdownInterval);
      setAutoSearchCountdown(null);
      executeSearch();
    }, 3000);

    return () => {
      clearTimeout(countdownStart);
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [origin, destination, date, time, selectedSchedule, executeSearch, hasSearchErrors]);

  const handleSwap = () => {
    if (!origin || !destination) return;
    if (!reverseRouteExists) return;
    userHasInteracted.current = true;
    setSearchQuery({ origin: destination, destination: origin });
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    input.focus();
    input.showPicker?.();
  };

  const retryFetch = async () => {
    setDataError(null);
    try {
      setStationsLoading(true);
      setSchedulesLoading(true);
      const [stationData, scheduleData] = await Promise.all([fetchStations(), fetchSchedules()]);
      setStations(stationData);
      setSchedules(scheduleData);
    } catch (error: unknown) {
      setDataError(getErrorMessage(error));
    } finally {
      setStationsLoading(false);
      setSchedulesLoading(false);
    }
  };

  return (
    <div className="glass-panel search-panel w-full max-w-5xl mx-auto">
      {autoSearchCountdown !== null && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-xs font-bold px-5 py-2 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 z-10">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{isNavigating ? 'Opening seats...' : `Searching in ${autoSearchCountdown}s...`}</span>
        </div>
      )}

      {dataError && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Train className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <p className="text-red-400 font-bold text-sm mb-1">Unable to Load Routes</p>
            <p className="text-slate-500 text-xs max-w-xs">{dataError}</p>
          </div>
          <button
            onClick={retryFetch}
            className="px-5 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {!dataError && (
        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_180px] gap-3 sm:gap-4 items-end transition-card">
          <div className="flex flex-col gap-2">
            <label className="field-label text-emerald-400">
              <MapPin className="w-3.5 h-3.5" /> Origin
            </label>
            {stationsLoading ? (
              <div className="skeleton-field" />
            ) : (
              <div className="select-shell">
                <select
                  value={origin}
                  onChange={(e) => {
                    userHasInteracted.current = true;
                    markTouched('origin');
                    setSearchQuery({ origin: e.target.value, destination: '', time: '' });
                  }}
                  className="input-select-field app-select focus:border-emerald-400/60 focus:ring-emerald-400/10"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-500">
                    Select origin...
                  </option>
                  {originOptions.map((s) => (
                    <option key={`from-${s.id}`} value={s.code} className="bg-slate-900 text-white">
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            )}
            {shouldShowError('origin') && <p className="field-error">{validationErrors.origin}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="field-label text-cyan-400">
              <Navigation className="w-3.5 h-3.5" /> Destination
            </label>
            <div className="flex gap-2">
              {stationsLoading ? (
                <div className="skeleton-field" />
              ) : (
                <div className="select-shell min-w-0 flex-1">
                  <select
                    value={destination}
                    onChange={(e) => {
                      userHasInteracted.current = true;
                      markTouched('destination');
                      setSearchQuery({ destination: e.target.value, time: '' });
                    }}
                    className="input-select-field app-select focus:border-cyan-400/60 focus:ring-cyan-400/10"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">
                      Select destination...
                    </option>
                    {destinationOptions.map((s) => (
                      <option key={`to-${s.id}`} value={s.code} className="bg-slate-900 text-white">
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="select-chevron" />
                </div>
              )}
              <button
                type="button"
                onClick={handleSwap}
                title="Swap stations"
                disabled={!origin || !destination || !reverseRouteExists}
                className="btn-icon-square disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
            {shouldShowError('destination') && <p className="field-error">{validationErrors.destination}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="field-label text-amber-400">
              <Calendar className="w-3.5 h-3.5" /> Date
            </label>
            <div
              role="button"
              tabIndex={0}
              onClick={openDatePicker}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDatePicker();
                }
              }}
              className="date-shell"
            >
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onFocus={openDatePicker}
                onChange={(e) => {
                  userHasInteracted.current = true;
                  markTouched('date');
                  setSearchQuery({ date: e.target.value });
                }}
                className="input-select-field date-field focus:border-amber-400/60 focus:ring-amber-400/10"
              />
            </div>
            {shouldShowError('date') && <p className="field-error">{validationErrors.date}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="field-label text-indigo-400">
              <Clock className="w-3.5 h-3.5" /> Time
            </label>
            {schedulesLoading ? (
              <div className="skeleton-field" />
            ) : (
              <div className="select-shell">
                <select
                  value={visibleSchedules.some((schedule) => schedule.value === time) ? time : ''}
                  onChange={(e) => {
                    userHasInteracted.current = true;
                    markTouched('time');
                    setSearchQuery({ time: e.target.value });
                  }}
                  className="input-select-field app-select focus:border-indigo-400/60 focus:ring-indigo-400/10"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-500">
                    {origin && destination && visibleSchedules.length === 0 ? 'No departures' : 'Select time...'}
                  </option>
                  {visibleSchedules.map((sch) => (
                    <option key={`sch-${sch.id}`} value={sch.value} className="bg-slate-900 text-white">
                      {sch.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            )}
            {shouldShowError('time') && <p className="field-error">{validationErrors.time}</p>}
          </div>
        </div>
      )}
      {!dataError && (
        <p className="mt-4 px-1 text-[11px] font-semibold text-slate-500">
          Supported routes: Colombo Fort - Kandy, Colombo Fort - Badulla, and Kandy - Badulla, including return journeys.
        </p>
      )}
    </div>
  );
}
