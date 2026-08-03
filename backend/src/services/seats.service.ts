import { prisma } from '../lib/prisma.js';
import { calculateSegmentMask } from '../utils/segmentMask.js';

export interface SeatAvailabilityQuery {
  trainId: string;
  scheduleId?: string;
  date: string;
  from?: string;
  to?: string;
}

export interface SeatLockRequest extends SeatAvailabilityQuery {
  seatId: string;
  sessionId: string;
}

export interface SeatReleaseRequest {
  trainId: string;
  scheduleId?: string;
  seatId: string;
  date: string;
  sessionId: string;
}

export async function getSeatAvailability({ trainId, scheduleId, date, from, to }: SeatAvailabilityQuery) {
  const travelDate = new Date(date);
  const reqMask = calculateSegmentMask(from ?? 'CMB', to ?? 'KND');

  await pruneExpiredLocks();

  const [seats, locks] = await Promise.all([
    prisma.seat.findMany({
      where: { trainId },
      orderBy: [{ class: 'asc' }, { seatNo: 'asc' }],
    }),
    prisma.temporaryLock.findMany({
      where: { trainId, travelDate, scheduleId: scheduleId ?? null },
    }),
  ]);

  return seats.map((seat) => {
    const activeLock = locks.find((lock) => lock.seatId === seat.id && (lock.segmentMask & reqMask) !== 0);
    return {
      id: seat.id,
      seatNo: seat.seatNo,
      class: seat.class,
      isLocked: !!activeLock,
      lockedBySessionId: activeLock?.sessionId ?? null,
    };
  });
}

export async function holdSeat({ trainId, scheduleId, seatId, date, from, to, sessionId }: SeatLockRequest) {
  const travelDate = new Date(date);
  const reqMask = calculateSegmentMask(from ?? 'CMB', to ?? 'KND');

  await pruneExpiredLocks();

  const existingLocks = await prisma.temporaryLock.findMany({
    where: { trainId, seatId, travelDate, scheduleId: scheduleId ?? null },
  });

  const conflictingLock = existingLocks.find((lock) => (lock.segmentMask & reqMask) !== 0);
  if (conflictingLock) {
    return {
      ok: conflictingLock.sessionId === sessionId,
      conflict: conflictingLock.sessionId !== sessionId,
      lock: conflictingLock,
    };
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const sameSessionLock = existingLocks.find((lock) => lock.sessionId === sessionId && lock.segmentMask === reqMask);

  const lock = sameSessionLock
    ? await prisma.temporaryLock.update({
        where: { id: sameSessionLock.id },
        data: { expiresAt },
      })
    : await prisma.temporaryLock.create({
        data: { trainId, scheduleId: scheduleId ?? null, seatId, travelDate, expiresAt, sessionId, segmentMask: reqMask },
      });

  return { ok: true, conflict: false, lock };
}

export async function releaseSeat({ trainId, seatId, date, sessionId }: SeatReleaseRequest) {
  const travelDate = new Date(date);
  return prisma.temporaryLock.deleteMany({ where: { trainId, seatId, travelDate, sessionId } });
}

function pruneExpiredLocks() {
  return prisma.temporaryLock.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
