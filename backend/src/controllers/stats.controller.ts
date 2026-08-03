import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { err } from '../utils/logger.js';

// Returns live availability stats for each route: total seats, locked, available
export async function getRouteStats(_req: Request, res: Response): Promise<void> {
  try {
    // Purge expired locks
    await prisma.temporaryLock.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const trains = await prisma.train.findMany({
      include: {
        seats: true,
        schedules: {
          include: {
            // Join origin and destination Station to get codes
          },
        },
      },
    });

    // Get all current active locks
    const activeLocks = await prisma.temporaryLock.findMany({
      where: { expiresAt: { gt: new Date() } },
    });

    const stats = trains.map((train) => {
      const total = train.seats.length;
      const locked = activeLocks.filter((l) => l.trainId === train.id).length;
      return {
        trainId: train.id,
        trainName: train.name,
        total,
        locked,
        available: total - locked,
      };
    });

    res.json({ success: true, data: stats });
  } catch (e) {
    err('STATS', 'Failed to fetch route stats.', e);
    res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
}
