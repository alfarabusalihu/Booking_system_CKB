import 'dotenv/config'; // Loads .env before the app imports Prisma-backed routes.
import { createApp } from './app.js';
import { log, err } from './utils/logger.js';

const PORT = Number(process.env.PORT) || 4000;

// Validate critical environment variables on startup
function validateEnvironment() {
  const errors: string[] = [];

  // Check JWT secret
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set in environment variables');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  } else if (process.env.JWT_SECRET.includes('your-secret-key') || 
             process.env.JWT_SECRET.includes('change-in-production')) {
    errors.push('JWT_SECRET is using default/placeholder value - must be changed for security');
  }

  // Check database connection
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set in environment variables');
  }

  if (errors.length > 0) {
    err('CONFIG', 'Critical configuration errors detected:');
    errors.forEach(error => err('CONFIG', `  - ${error}`));
    err('CONFIG', 'Please fix these issues in your .env file before starting the server.');
    process.exit(1);
  }

  log('CONFIG', '✓ Environment validation passed');
}

// Validate environment before starting server
validateEnvironment();

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
  log('BOOT', `JWT_SECRET: ${process.env.JWT_SECRET?.slice(0, 8)}... (${process.env.JWT_SECRET?.length} chars)`);
  log('BOOT', '  Routes: GET /health | /api/stations | /api/schedules | /api/search | /api/seats');
});
