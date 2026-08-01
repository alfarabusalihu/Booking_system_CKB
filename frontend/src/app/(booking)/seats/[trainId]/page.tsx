import React from 'react';
import { Train } from 'lucide-react';

interface SeatPageProps {
  params: Promise<{ trainId: string }>;
  searchParams: Promise<{ date?: string; time?: string; from?: string; to?: string }>;
}

export default async function SeatPage({ params, searchParams }: SeatPageProps) {
  const { trainId } = await params;
  const { date, time, from, to } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
          <Train className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Seat Map</h1>
        <p className="text-slate-400 mb-6 text-sm">
          <span className="text-emerald-400 font-semibold">{from}</span>
          {' → '}
          <span className="text-cyan-400 font-semibold">{to}</span>
          {' on '}{date}{' at '}{time}
        </p>
        <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 px-6 py-5 text-left">
          <p className="text-amber-400 font-bold text-sm mb-1">Stage 3 — Coming Next</p>
          <p className="text-slate-500 text-sm">
            The interactive seat map, <code className="text-indigo-300">{'<TrainTimeSwitcher />'}</code>, bitmask segment availability, and 10-minute atomic seat locking engine will be built in Stage 3.
          </p>
          <p className="text-slate-600 text-xs mt-3">Train ID: <code className="text-slate-400">{trainId}</code></p>
        </div>
      </div>
    </main>
  );
}
