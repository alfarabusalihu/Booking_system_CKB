import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { err, log } from '../utils/logger.js';

export async function getStations(_req: Request, res: Response): Promise<void> {
  try {
    const stations = await prisma.station.findMany({ orderBy: { name: 'asc' } });

    if (stations.length === 0) {
      err('STATIONS', 'No stations in database. Run: npm run seed');
      res.status(404).json({ success: false, error: 'No stations found. Run npm run seed in the backend.' });
      return;
    }

    log('STATIONS', `Returning ${stations.length} stations.`);
    res.json({ success: true, data: stations });
  } catch (e) {
    err('STATIONS', 'Database query failed.', e);
    res.status(500).json({ success: false, error: 'Failed to fetch stations.' });
  }
}
