import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { err, log } from '../utils/logger.js';

export async function searchTrains(req: Request, res: Response): Promise<void> {
  const { from, destination, date, time } = req.query;

  if (!from || !destination || !date) {
    err('SEARCH', `Missing params. Got: from=${from}, destination=${destination}, date=${date}`);
    res.status(400).json({ success: false, error: 'from, destination, and date are required.' });
    return;
  }

  try {
    const train = await prisma.train.findFirst();

    if (!train) {
      err('SEARCH', 'No trains in database. Run: npm run seed');
      res.status(404).json({ success: false, error: 'No trains found. Run npm run seed.' });
      return;
    }

    log('SEARCH', `Route: ${from} → ${destination} | Date: ${date} | Time: ${time} | Train: ${train.name}`);
    res.json({
      success: true,
      trainId: train.id,
      trainName: train.name,
      from,
      destination,
      date,
      time: time || '08:00',
    });
  } catch (e) {
    err('SEARCH', 'Database query failed.', e);
    res.status(500).json({ success: false, error: 'Search failed.' });
  }
}
