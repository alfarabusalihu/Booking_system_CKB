import type { Station, ScheduleOption } from '@/modules/core/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
  console.log('[SEARCH_API] Stations loaded from backend:', data.data.length);
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
  console.log('[SEARCH_API] Schedules loaded from backend:', data.data.length);
  return data.data;
}
