import type { Request, Response } from 'express';
import { err, log } from '../utils/logger.js';
import { getSeatAvailability, holdSeat, releaseSeat } from '../services/seats.service.js';

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
  const { trainId, scheduleId, seatId, date, from, to, sessionId } = req.body as Record<string, string>;

  if (!trainId || !seatId || !date || !sessionId) {
    res.status(400).json({ success: false, error: 'Missing required parameters.' });
    return;
  }

  try {
    const result = await holdSeat({ trainId, scheduleId, seatId, date, from, to, sessionId });

    if (result.conflict) {
      res.status(409).json({ success: false, error: 'Seat is already locked by another passenger.' });
      return;
    }

    log('LOCK', `Locked seat ${seatId} for train ${trainId} until ${result.lock.expiresAt.toISOString()}`);
    res.json({ success: true, lock: result.lock });
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
