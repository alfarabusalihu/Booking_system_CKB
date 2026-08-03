import { fetchSchedules, fetchStations } from '@/modules/search/api';
import type { ScheduleOption, Station } from '@/modules/core/store';
import { SeatMapContainer } from '@/modules/seat-booking/components/SeatMapContainer';
import { fetchSeats, type SeatData } from '@/modules/search/api';

export const dynamic = 'force-dynamic';

interface SeatPageProps {
  params: Promise<{ trainId: string }>;
  searchParams: Promise<{ date?: string; time?: string; scheduleId?: string; from?: string; to?: string }>;
}

export default async function SeatPage({ params, searchParams }: SeatPageProps) {
  const { trainId } = await params;
  const { date = new Date().toISOString().split('T')[0], scheduleId = '', from = 'CMB', to = 'KND' } = await searchParams;

  let schedules: ScheduleOption[] = [];
  let stations: Station[] = [];
  let seats: SeatData[] = [];
  try {
    [schedules, stations, seats] = await Promise.all([
      fetchSchedules(),
      fetchStations(),
      fetchSeats(trainId, date, from, to, scheduleId),
    ]);
  } catch (e) {
    console.error('[SEAT_PAGE] Failed to fetch SSR booking data:', e);
  }

  const totalSeats = seats.length;
  const bookedSeats = seats.filter((seat) => seat.isLocked).length;
  const availableSeats = totalSeats - bookedSeats;

  return (
    <main className="w-full min-h-screen bg-slate-950 text-slate-100 py-6 px-6 lg:px-12 pb-32">
      <div className="w-full">
        <SeatMapContainer
          trainId={trainId}
          scheduleId={scheduleId}
          date={date}
          from={from}
          to={to}
          schedules={schedules}
          stations={stations}
          totalSeats={totalSeats}
          availableSeats={availableSeats}
          bookedSeats={bookedSeats}
          initialSeats={seats}
        />
      </div>
    </main>
  );
}
