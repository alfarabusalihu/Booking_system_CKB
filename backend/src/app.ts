import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middleware/requestLogger.js';
import stationsRouter from './routes/stations.routes.js';
import schedulesRouter from './routes/schedules.routes.js';
import searchRouter from './routes/search.routes.js';
import seatsRouter from './routes/seats.routes.js';
import statsRouter from './routes/stats.routes.js';
import authRouter from './routes/auth.routes.js';
import checkoutRouter from './routes/checkout.routes.js';

export function createApp(): Application {
  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'LK Train Reservation API' });
  });

  app.use('/api/stations', stationsRouter);
  app.use('/api/schedules', schedulesRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/seats', seatsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/checkout', checkoutRouter);
  
  // Hidden admin route - protected by authentication
  // Provides booking statistics (total/locked/available seats per train)
  // Access: /api/internal/analytics (requires auth token)
  app.use('/api/internal/analytics', statsRouter);

  return app;
}
