import express, { type Application } from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import stationsRouter from './routes/stations.routes.js';
import schedulesRouter from './routes/schedules.routes.js';
import searchRouter from './routes/search.routes.js';
import seatsRouter from './routes/seats.routes.js';
import statsRouter from './routes/stats.routes.js';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'LK Train Reservation API' });
  });

  app.use('/api/stations', stationsRouter);
  app.use('/api/schedules', schedulesRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/seats', seatsRouter);
  app.use('/api/stats', statsRouter);

  return app;
}
