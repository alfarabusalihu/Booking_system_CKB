'use server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function holdSeatAction(params: {
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
    cache: 'no-store',
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

export async function releaseSeatAction(params: {
  trainId: string;
  seatId: string;
  date: string;
  sessionId: string;
}): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/seats/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    cache: 'no-store',
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}
