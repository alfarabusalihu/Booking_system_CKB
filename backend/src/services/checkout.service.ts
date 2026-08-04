import { getReservationsByIds } from './seats.service.js';
import { prisma } from '../lib/prisma.js';

export async function finalizeTicketData(reservationIds: string[], userId: string) {
  const reservations = await getReservationsByIds(reservationIds);
  const allConfirmed = reservations.every((r: any) => r.status === 'CONFIRMED' && r.userId === userId);
  if (!allConfirmed) {
    throw new Error('RESERVATIONS_NOT_CONFIRMED');
  }
  return reservations;
}

export async function checkIdentificationAvailability(
  identificationType: string,
  identificationNumber: string,
  travelDate: Date,
  excludeReservationIds?: string[]
) {
  const conflictingBookings = await prisma.seatReservation.findMany({
    where: {
      identificationType,
      identificationNumber,
      travelDate: {
        equals: travelDate,
      },
      status: {
        in: ['HOLD', 'CONFIRMED'],
      },
      ...(excludeReservationIds && excludeReservationIds.length > 0
        ? { id: { notIn: excludeReservationIds } }
        : {}),
    },
    include: {
      seat: {
        select: {
          seatNo: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  });

  if (conflictingBookings.length > 0) {
    return {
      isAvailable: false,
      conflictingBooking: conflictingBookings[0],
    };
  }

  return {
    isAvailable: true,
  };
}
