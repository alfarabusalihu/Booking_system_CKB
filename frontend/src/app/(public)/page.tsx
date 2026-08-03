import { SearchBox } from '@/modules/search/components/SearchBox';

export const metadata = {
  title: 'Sri Lanka Train Reservation | Search Routes',
  description: 'Book train tickets across Sri Lanka with real-time seat locks and segment bitmask availability.',
};

export default function HeroSearchPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 pt-24 pb-12 sm:pt-28 sm:pb-16 relative overflow-hidden">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-600/30 to-indigo-600/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl mb-8 sm:mb-10">
        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Sri Lanka Railways Express
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
          Reserve Your Train Seats <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Instantly</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
          Experience real-time seat reservation with instant atomic holds across Colombo, Kandy, Badulla & beyond.
        </p>
      </div>

      {/* Hero Search Box Component */}
      <div id="search" className="w-full">
        <SearchBox />
      </div>
    </main>
  );
}
