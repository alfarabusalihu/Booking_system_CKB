'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Calendar, Clock, ArrowRightLeft, Train, Loader2 } from 'lucide-react';
import { useBookingStore } from '@/modules/core/store';
import { fetchStations, fetchSchedules } from '@/modules/search/api';

export function SearchBox() {
  const router = useRouter();

  const { searchQuery, setSearchQuery, stations, setStations, schedules, setSchedules } = useBookingStore();
  const { origin, destination, date, time } = searchQuery;

  const [stationsLoading, setStationsLoading] = useState(false);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [autoSearchCountdown, setAutoSearchCountdown] = useState<number | null>(null);
  const isInitialMount = useRef(true);
  const userHasInteracted = useRef(false);

  // Fetch stations & schedules dynamically from backend API on fresh page load
  useEffect(() => {
    setDataError(null);

    const loadData = async () => {
      try {
        setStationsLoading(true);
        const stationData = await fetchStations();
        setStations(stationData);
      } catch (error: any) {
        console.error('[SEARCH_MODULE] Failed to load stations:', error.message);
        setDataError(error.message);
      } finally {
        setStationsLoading(false);
      }

      try {
        setSchedulesLoading(true);
        const scheduleData = await fetchSchedules();
        setSchedules(scheduleData);
      } catch (error: any) {
        console.error('[SEARCH_MODULE] Failed to load schedules:', error.message);
        setDataError((prev) => prev ?? error.message);
      } finally {
        setSchedulesLoading(false);
      }
    };

    loadData();
  }, []);

  const executeSearch = () => {
    if (!origin || !destination) return;
    console.log('[SEARCH_MODULE] Auto-executing search via Zustand state:', searchQuery);
    const defaultTrainId = 'train-podi-menike';
    router.push(`/seats/${defaultTrainId}?date=${date}&time=${time}&from=${origin}&to=${destination}`);
  };

  // Auto-search 10s after the user manually changes any field
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!userHasInteracted.current) return;
    if (!origin || !destination) return;

    setAutoSearchCountdown(10);
    const countdownInterval = setInterval(() => {
      setAutoSearchCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    const timer = setTimeout(() => {
      clearInterval(countdownInterval);
      setAutoSearchCountdown(null);
      executeSearch();
    }, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [origin, destination, date, time]);

  const handleSwap = () => {
    if (!origin || !destination) return;
    userHasInteracted.current = true;
    setSearchQuery({ origin: destination, destination: origin });
  };

  const retryFetch = async () => {
    setDataError(null);
    try {
      setStationsLoading(true);
      setSchedulesLoading(true);
      const [stationData, scheduleData] = await Promise.all([fetchStations(), fetchSchedules()]);
      setStations(stationData);
      setSchedules(scheduleData);
    } catch (error: any) {
      setDataError(error.message);
    } finally {
      setStationsLoading(false);
      setSchedulesLoading(false);
    }
  };

  return (
    <div className="glass-panel w-full max-w-5xl mx-auto">
      {/* Auto-search countdown toast */}
      {autoSearchCountdown !== null && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-xs font-bold px-5 py-2 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 z-10">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Searching in {autoSearchCountdown}s…</span>
        </div>
      )}

      {/* Error State */}
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
            className="px-5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Inputs */}
      {!dataError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
          {/* 1. Origin (From) */}
          <div className="flex flex-col gap-2.5">
            <label className="field-label text-emerald-400">
              <MapPin className="w-3.5 h-3.5" /> Origin (From)
            </label>
            {stationsLoading ? (
              <div className="skeleton-field" />
            ) : (
              <select
                value={origin}
                onChange={(e) => {
                  userHasInteracted.current = true;
                  setSearchQuery({ origin: e.target.value });
                }}
                className="input-select-field focus:border-emerald-400/60 focus:ring-emerald-400/10"
              >
                <option value="" disabled className="bg-slate-900 text-slate-500">
                  Select origin…
                </option>
                {stations.map((s) => (
                  <option key={`from-${s.id}`} value={s.code} disabled={s.code === destination} className="bg-slate-900 text-white">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Destination (To) */}
          <div className="flex flex-col gap-2.5">
            <label className="field-label text-cyan-400">
              <Navigation className="w-3.5 h-3.5" /> Destination (To)
            </label>
            <div className="flex gap-2">
              {stationsLoading ? (
                <div className="skeleton-field" />
              ) : (
                <select
                  value={destination}
                  onChange={(e) => {
                    userHasInteracted.current = true;
                    setSearchQuery({ destination: e.target.value });
                  }}
                  className="input-select-field focus:border-cyan-400/60 focus:ring-cyan-400/10"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-500">
                    Select destination…
                  </option>
                  {stations.map((s) => (
                    <option key={`to-${s.id}`} value={s.code} disabled={s.code === origin} className="bg-slate-900 text-white">
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              )}
              <button type="button" onClick={handleSwap} title="Swap stations" className="btn-icon-square">
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>

          {/* 3. Travel Date */}
          <div className="flex flex-col gap-2.5">
            <label className="field-label text-amber-400">
              <Calendar className="w-3.5 h-3.5" /> Travel Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                userHasInteracted.current = true;
                setSearchQuery({ date: e.target.value });
              }}
              className="input-select-field focus:border-amber-400/60 focus:ring-amber-400/10"
            />
          </div>

          {/* 4. Departure Time */}
          <div className="flex flex-col gap-2.5">
            <label className="field-label text-indigo-400">
              <Clock className="w-3.5 h-3.5" /> Departure Time
            </label>
            {schedulesLoading ? (
              <div className="skeleton-field" />
            ) : (
              <select
                value={time}
                onChange={(e) => {
                  userHasInteracted.current = true;
                  setSearchQuery({ time: e.target.value });
                }}
                className="input-select-field focus:border-indigo-400/60 focus:ring-indigo-400/10"
              >
                <option value="" disabled className="bg-slate-900 text-slate-500">
                  Select time…
                </option>
                {schedules.map((sch) => (
                  <option key={`sch-${sch.id}`} value={sch.value} className="bg-slate-900 text-white">
                    {sch.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
