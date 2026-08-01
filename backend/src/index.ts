import 'dotenv/config'; // Must be first — loads .env before anything else
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const log = (scope: string, msg: string) =>
  process.stdout.write(`[${new Date().toISOString()}] [${scope}] ${msg}\n`);

const err = (scope: string, msg: string, error?: unknown) => {
  process.stderr.write(`[${new Date().toISOString()}] [${scope}] ERROR: ${msg}\n`);
  if (error) process.stderr.write(`  ${String(error)}\n`);
};

// ─── Database Connection ──────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  err('BOOT', 'DATABASE_URL is not set in .env! Server cannot start.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Verify DB is reachable at startup
pool.query('SELECT 1')
  .then(() => log('DB', '✓ PostgreSQL connection verified.'))
  .catch((e) => {
    err('DB', '✗ Cannot connect to PostgreSQL. Is the database running?', e);
    process.exit(1);
  });

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, _res, next) => {
  log('HTTP', `${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Sri Lanka Train Reservation API' });
});

app.get('/api/stations', async (_req, res) => {
  try {
    const stations = await prisma.station.findMany({ orderBy: { name: 'asc' } });

    if (stations.length === 0) {
      err('STATIONS', 'No stations in database. Run: npm run seed');
      return res.status(404).json({ success: false, error: 'No stations found. Run npm run seed in the backend.' });
    }

    log('STATIONS', `Returning ${stations.length} stations.`);
    res.json({ success: true, data: stations });
  } catch (e) {
    err('STATIONS', 'Database query failed.', e);
    res.status(500).json({ success: false, error: 'Failed to fetch stations.' });
  }
});

// GET /api/schedules - Fetch available departure times from database
app.get('/api/schedules', async (_req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: { train: true },
      orderBy: { departureTime: 'asc' },
    });

    if (schedules.length === 0) {
      err('SCHEDULES', 'No schedules in database. Run: npm run seed');
      return res.status(404).json({ success: false, error: 'No schedules found. Run npm run seed.' });
    }

    const formattedSchedules = schedules.map((s) => {
      const depDate = new Date(s.departureTime);
      const timeStr = depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const value = `${String(depDate.getHours()).padStart(2, '0')}:${String(depDate.getMinutes()).padStart(2, '0')}`;
      return {
        id: s.id,
        value,
        label: `${timeStr} (${s.train.name})`,
      };
    });

    log('SCHEDULES', `Returning ${formattedSchedules.length} schedules.`);
    res.json({ success: true, data: formattedSchedules });
  } catch (e) {
    err('SCHEDULES', 'Database query failed.', e);
    res.status(500).json({ success: false, error: 'Failed to fetch schedules.' });
  }
});

app.get('/api/search', async (req, res) => {
  const { from, destination, date, time } = req.query;

  if (!from || !destination || !date) {
    err('SEARCH', `Missing required query params. Got: from=${from}, destination=${destination}, date=${date}`);
    return res.status(400).json({ success: false, error: 'from, destination, and date are required.' });
  }

  try {
    const train = await prisma.train.findFirst();

    if (!train) {
      err('SEARCH', 'No trains in database. Run: npm run seed');
      return res.status(404).json({ success: false, error: 'No trains found. Run npm run seed.' });
    }

    log('SEARCH', `Route: ${from} → ${destination} | Date: ${date} | Time: ${time} | Train: ${train.name}`);
    res.json({ success: true, trainId: train.id, trainName: train.name, from, destination, date, time: time || '08:00' });
  } catch (e) {
    err('SEARCH', 'Database query failed.', e);
    res.status(500).json({ success: false, error: 'Search failed.' });
  }
});

// ─── Global Error Handlers ────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  err('PROCESS', 'Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (e) => {
  err('PROCESS', 'Uncaught Exception — shutting down.', e);
  process.exit(1);
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  log('BOOT', `✓ Server running at http://localhost:${PORT}`);
  log('BOOT', `✓ DATABASE_URL loaded: ${process.env.DATABASE_URL?.split('@')[1] ?? 'unknown'}`);
  log('BOOT', '  Available routes:');
  log('BOOT', '  GET /health');
  log('BOOT', '  GET /api/stations');
  log('BOOT', '  GET /api/schedules');
  log('BOOT', '  GET /api/search?from=&destination=&date=&time=');
});
