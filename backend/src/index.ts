import 'dotenv/config'; // Loads .env before the app imports Prisma-backed routes.
import { createApp } from './app.js';
import { log, err } from './utils/logger.js';

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

process.on('unhandledRejection', (reason) => {
  err('PROCESS', 'Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (e) => {
  err('PROCESS', 'Uncaught exception; shutting down.', e);
  process.exit(1);
});

app.listen(PORT, () => {
  log('BOOT', `Server running at http://localhost:${PORT}`);
  log('BOOT', `DATABASE_URL: ${process.env.DATABASE_URL?.split('@')[1] ?? 'unknown'}`);
  log('BOOT', '  Routes: GET /health | /api/stations | /api/schedules | /api/search | /api/seats');
});
