import type { Request, Response } from 'express';
import { err, log } from '../utils/logger.js';
import { getSeatAvailability, holdSeat, releaseSeat } from '../services/seats.service.js';
import { prisma } from '../lib/prisma.js';

export async function getSeats(req: Request, res: Response): Promise<void> {
  const { trainId, scheduleId, date, from, to } = req.query;

  if (!trainId || !date) {
    res.status(400).json({ success: false, error: 'trainId and date are required.' });
    return;
  }

  try {
    const data = await getSeatAvailability({
      trainId: String(trainId),
      scheduleId: scheduleId ? String(scheduleId) : undefined,
      date: String(date),
      from: String(from ?? 'CMB'),
      to: String(to ?? 'KND'),
    });

    res.json({ success: true, data });
  } catch (e) {
    err('SEATS', 'Failed to fetch seats.', e);
    res.status(500).json({ success: false, error: 'Failed to fetch seats.' });
  }
}

export async function lockSeat(req: Request, res: Response): Promise<void> {
  const { trainId, scheduleId, seatId, date, from, to, sessionId, priceLkr } = req.body as Record<
    string,
    string | number | undefined
  >;

  if (!trainId || !seatId || !date || !sessionId) {
    res.status(400).json({ success: false, error: 'Missing required parameters.' });
    return;
  }

  try {
    // Use authenticated user ID from middleware if available
    const userId = req.user?.id;
    
    const result = await holdSeat({
      trainId: String(trainId),
      scheduleId: scheduleId ? String(scheduleId) : undefined,
      seatId: String(seatId),
      date: String(date),
      from: from ? String(from) : undefined,
      to: to ? String(to) : undefined,
      sessionId: String(sessionId),
      userId: userId,
      priceLkr: typeof priceLkr === 'number' ? priceLkr : Number(priceLkr) || 0,
    });

    if (result.conflict) {
      res.status(409).json({ success: false, error: 'Seat is already locked by another passenger.' });
      return;
    }

    log('LOCK', `Locked seat ${seatId} for train ${trainId} until ${result.lock.expiresAt.toISOString()}`);
    res.json({
      success: true,
      lock: result.lock,
      reservationId: result.lock.id,
    });
  } catch (e) {
    err('LOCK', 'Failed to lock seat.', e);
    res.status(500).json({ success: false, error: 'Failed to lock seat.' });
  }
}

export async function unlockSeat(req: Request, res: Response): Promise<void> {
  const { trainId, seatId, date, sessionId } = req.body as Record<string, string>;

  if (!trainId || !seatId || !date || !sessionId) {
    res.status(400).json({ success: false, error: 'Missing required parameters.' });
    return;
  }

  try {
    await releaseSeat({ trainId, seatId, date, sessionId });

    log('UNLOCK', `Unlocked seat ${seatId} for session ${sessionId}`);
    res.json({ success: true, message: 'Seat unlocked successfully.' });
  } catch (e) {
    err('UNLOCK', 'Failed to unlock seat.', e);
    res.status(500).json({ success: false, error: 'Failed to unlock seat.' });
  }
}

export async function validateReservations(req: Request, res: Response): Promise<void> {
  const { reservationIds } = req.body as { reservationIds: string[] };

  if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
    res.status(400).json({ success: false, error: 'reservationIds array is required.' });
    return;
  }

  try {
    const reservations = await getSeatAvailability({ trainId: '', date: '' }).then(() => 
      prisma.seatReservation.findMany({
        where: { id: { in: reservationIds } },
        select: { id: true, status: true, expiresAt: true }
      })
    ).catch(() => 
      prisma.seatReservation.findMany({
        where: { id: { in: reservationIds } },
        select: { id: true, status: true, expiresAt: true }
      })
    );

    const now = new Date();
    const valid: string[] = [];
    const expired: string[] = [];
    const invalid: string[] = [];

    reservationIds.forEach(id => {
      const reservation = reservations.find(r => r.id === id);
      
      if (!reservation) {
        invalid.push(id);
      } else if (reservation.status === 'EXPIRED' || reservation.expiresAt <= now) {
        expired.push(id);
      } else if (reservation.status === 'HOLD' || reservation.status === 'CONFIRMED') {
        valid.push(id);
      } else {
        invalid.push(id);
      }
    });

    log('VALIDATE', `Checked ${reservationIds.length} reservations: ${valid.length} valid, ${expired.length} expired, ${invalid.length} invalid`);
    
    res.json({ 
      success: true, 
      result: { valid, expired, invalid }
    });
  } catch (e) {
    err('VALIDATE', 'Failed to validate reservations.', e);
    res.status(500).json({ success: false, error: 'Failed to validate reservations.' });
  }
}
