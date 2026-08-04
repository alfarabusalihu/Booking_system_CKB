import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { err, log } from '../utils/logger.js';

export async function getSchedules(_req: Request, res: Response): Promise<void> {
  try {
    const [schedules, stations] = await Promise.all([
      prisma.schedule.findMany({
        include: { train: true },
        orderBy: { departureTime: 'asc' },
      }),
      prisma.station.findMany(),
    ]);
    const stationById = new Map(stations.map((station) => [station.id, station]));

    if (schedules.length === 0) {
      err('SCHEDULES', 'No schedules in database. Run: npm run seed');
      res.status(404).json({ success: false, error: 'No schedules found. Run npm run seed.' });
      return;
    }

    const formatted = schedules.map((s) => {
      const dep = new Date(s.departureTime);
      const arr = new Date(s.arrivalTime);
      
      const depTimeStr = dep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const arrTimeStr = arr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      const value = `${String(dep.getHours()).padStart(2, '0')}:${String(dep.getMinutes()).padStart(2, '0')}`;
      const originName = stationById.get(s.originId)?.name ?? '';
      const destinationName = stationById.get(s.destinationId)?.name ?? '';
      
      return {
        id: s.id,
        trainId: s.trainId,
        trainName: s.train.name,
        origin: stationById.get(s.originId)?.code ?? '',
        destination: stationById.get(s.destinationId)?.code ?? '',
        originName,
        destinationName,
        departureTime: depTimeStr,
        arrivalTime: arrTimeStr,
        value,
        label: `${depTimeStr} - ${arrTimeStr} | ${s.train.name}`,
      };
    });

    log('SCHEDULES', `Returning ${formatted.length} schedules.`);
    res.json({ success: true, data: formatted });
  } catch (e) {
    err('SCHEDULES', 'Database query failed.', e);
    res.status(500).json({ success: false, error: 'Failed to fetch schedules.' });
  }
}
