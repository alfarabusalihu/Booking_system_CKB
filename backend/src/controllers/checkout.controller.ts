import type { Request, Response } from 'express';
import { finalizeTicketData, checkIdentificationAvailability } from '../services/checkout.service.js';
import { err } from '../utils/logger.js';

// Note: Real Stripe payment handlers removed - see STRIPE_INTEGRATION_GUIDE.md for production setup

export async function getTicketDataHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const { reservationIds } = req.body as { reservationIds: string[] };

  if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
    res.status(400).json({ success: false, error: 'reservationIds array is required.' });
    return;
  }

  try {
    const reservations = await finalizeTicketData(reservationIds, req.user.id);
    res.json({
      success: true,
      reservations: reservations.map((r: any) => ({
        id: r.id,
        bookingRef: r.bookingRef,
        trainId: r.trainId,
        seatNo: r.seat.seatNo,
        class: r.seat.class,
        travelDate: r.travelDate,
        priceLkr: r.priceLkr,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'RESERVATIONS_NOT_CONFIRMED') {
      res.status(400).json({ success: false, error: 'Reservations not confirmed.' });
      return;
    }
    err('CHECKOUT', 'Failed to fetch ticket data.', e);
    res.status(500).json({ success: false, error: 'Failed to fetch ticket data.' });
  }
}

/**
 * Check if an identification number is available for booking on a specific date
 */
export async function checkIdentificationHandler(req: Request, res: Response): Promise<void> {
  const { identificationType, identificationNumber, travelDate } = req.body as {
    identificationType: string;
    identificationNumber: string;
    travelDate: string;
  };

  if (!identificationType || !identificationNumber || !travelDate) {
    res.status(400).json({ 
      success: false, 
      error: 'identificationType, identificationNumber, and travelDate are required.' 
    });
    return;
  }

  try {
    const dateObj = new Date(travelDate);
    const result = await checkIdentificationAvailability(
      identificationType,
      identificationNumber,
      dateObj
    );

    if (!result.isAvailable) {
      res.json({
        success: true,
        available: false,
        message: `This ${identificationType} (${identificationNumber}) is already used in an active booking for ${travelDate}. Each person can only have one active booking per travel date.`,
        conflictingSeat: result.conflictingBooking?.seat?.seatNo,
      });
      return;
    }

    res.json({
      success: true,
      available: true,
      message: 'Identification is available for booking.',
    });
  } catch (e) {
    err('CHECKOUT', 'Failed to check identification availability.', e);
    res.status(500).json({ success: false, error: 'Failed to check identification availability.' });
  }
}
