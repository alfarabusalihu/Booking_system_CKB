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
  userId?: string;
  priceLkr?: number;
}

export interface SeatReleaseRequest {
  trainId: string;
  scheduleId?: string;
  seatId: string;
  date: string;
  sessionId: string;
}

interface ActiveReservationRow {
  id: string;
  sessionId: string;
  segmentMask: number;
  status: string;
  expiresAt: Date;
}

export async function getSeatAvailability({ trainId, scheduleId, date, from, to }: SeatAvailabilityQuery) {
  const travelDate = new Date(date);
  const reqMask = calculateSegmentMask(from ?? 'CMB', to ?? 'KND');

  await pruneExpiredReservations();

  const [seats, reservations, legacyLocks] = await Promise.all([
    prisma.seat.findMany({
      where: { trainId },
      orderBy: [{ class: 'asc' }, { seatNo: 'asc' }],
    }),
    prisma.seatReservation.findMany({
      where: {
        trainId,
        travelDate,
        // Don't filter by scheduleId - check all schedules on this train
        status: { in: ['HOLD', 'CONFIRMED'] },
        OR: [{ status: 'CONFIRMED' }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.temporaryLock.findMany({
      where: { 
        trainId, 
        travelDate,
        expiresAt: { gt: new Date() } 
      },
    }),
  ]);

  return seats.map((seat: any) => {
    const reservation = reservations.find(
      (row: any) => row.seatId === seat.id && (row.segmentMask & reqMask) !== 0
    );
    const legacyLock = legacyLocks.find(
      (lock: any) => lock.seatId === seat.id && (lock.segmentMask & reqMask) !== 0
    );
    const active = reservation ?? legacyLock;
    return {
      id: seat.id,
      seatNo: seat.seatNo,
      class: seat.class,
      isLocked: !!active,
      lockedBySessionId: active?.sessionId ?? null,
    };
  });
}

export async function holdSeat({
  trainId,
  scheduleId,
  seatId,
  date,
  from,
  to,
  sessionId,
  userId,
  priceLkr = 0,
}: SeatLockRequest) {
  const travelDate = new Date(date);
  const reqMask = calculateSegmentMask(from ?? 'CMB', to ?? 'KND');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pruneExpiredReservations();

  return prisma.$transaction(async (tx) => {
  const overlapping = await tx.$queryRaw<ActiveReservationRow[]>`
      SELECT id, "sessionId", "segmentMask", status, "expiresAt"
      FROM "SeatReservation"
      WHERE "trainId" = ${trainId}
        AND "travelDate" = ${travelDate}::date
        AND "seatId" = ${seatId}
        AND status IN ('HOLD'::"ReservationStatus", 'CONFIRMED'::"ReservationStatus")
        AND (status = 'CONFIRMED'::"ReservationStatus" OR "expiresAt" > NOW())
        AND ("segmentMask" & ${reqMask}) <> 0
      FOR UPDATE
    `;

    const foreignConflict = overlapping.find((row) => row.sessionId !== sessionId);
    if (foreignConflict) {
      return { ok: false, conflict: true, lock: foreignConflict };
    }

    const ownLock = overlapping.find((row) => row.sessionId === sessionId && row.segmentMask === reqMask);

    if (ownLock) {
      const updated = await tx.seatReservation.update({
        where: { id: ownLock.id },
        data: { expiresAt, status: 'HOLD', priceLkr, userId: userId ?? undefined },
      });
      return { ok: true, conflict: false, lock: updated };
    }

    const reservation = await tx.seatReservation.create({
      data: {
        trainId,
        scheduleId: scheduleId ?? null,
        seatId,
        travelDate,
        segmentMask: reqMask,
        status: 'HOLD',
        sessionId,
        expiresAt,
        userId: userId ?? null,
        priceLkr,
      },
    });

    return { ok: true, conflict: false, lock: reservation };
  });
}

export async function releaseSeat({ trainId, seatId, date, sessionId }: SeatReleaseRequest) {
  const travelDate = new Date(date);
  return prisma.seatReservation.deleteMany({
    where: { trainId, seatId, travelDate, sessionId, status: 'HOLD' },
  });
}

export async function confirmReservations(
  reservationIds: string[],
  paymentIntentId: string,
  bookingRef: string
) {
  return prisma.seatReservation.updateMany({
    where: { id: { in: reservationIds }, status: 'HOLD' },
    data: {
      status: 'CONFIRMED',
      paymentIntentId,
      bookingRef,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getReservationsByIds(ids: string[]) {
  return prisma.seatReservation.findMany({
    where: { id: { in: ids } },
    include: { seat: true },
  });
}

function pruneExpiredReservations() {
  return prisma.seatReservation.updateMany({
    where: { status: 'HOLD', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
}
