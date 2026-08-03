import type { Station, ScheduleOption } from '@/modules/core/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface SeatData {
  id: string;
  seatNo: string;
  class: string;
  isLocked: boolean;
  lockedBySessionId: string | null;
}

export async function fetchStations(): Promise<Station[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/stations`);
  } catch {
    throw new Error(`Cannot connect to the backend at ${API_BASE_URL}. Is the server running?`);
  }

  if (res.status === 404) {
    throw new Error('No stations found in the database. Run: npm run seed in the backend folder.');
  }
  if (!res.ok) {
    throw new Error(`Backend error (status ${res.status}). Check the backend logs.`);
  }

  const data = await res.json();
  return data.data;
}

export async function fetchSchedules(): Promise<ScheduleOption[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/schedules`);
  } catch {
    throw new Error(`Cannot connect to the backend at ${API_BASE_URL}. Is the server running?`);
  }

  if (res.status === 404) {
    throw new Error('No schedules found in the database. Run: npm run seed in the backend folder.');
  }
  if (!res.ok) {
    throw new Error(`Backend error (status ${res.status}). Check the backend logs.`);
  }

  const data = await res.json();
  return data.data;
}

export async function fetchSeats(
  trainId: string,
  date: string,
  from?: string,
  to?: string,
  scheduleId?: string
): Promise<SeatData[]> {
  const url = new URL(`${API_BASE_URL}/api/seats`);
  url.searchParams.set('trainId', trainId);
  url.searchParams.set('date', date);
  if (scheduleId) url.searchParams.set('scheduleId', scheduleId);
  if (from) url.searchParams.set('from', from);
  if (to) url.searchParams.set('to', to);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch seat layout (Status ${res.status}).`);
  }
  const data = await res.json();
  return data.data;
}

export async function lockSeat(params: {
  trainId: string;
  scheduleId?: string;
  seatId: string;
  date: string;
  from?: string;
  to?: string;
  sessionId: string;
}): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/seats/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (res.status === 409) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Seat is already locked by another passenger.');
  }

  if (!res.ok) {
    throw new Error('Failed to hold seat.');
  }

  const data = await res.json();
  return data.success;
}

export async function unlockSeat(params: {
  trainId: string;
  seatId: string;
  date: string;
  sessionId: string;
}): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/seats/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}
