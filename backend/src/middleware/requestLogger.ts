import type { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger.js';

// Logs every incoming HTTP request with method and path
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  log('HTTP', `${req.method} ${req.path}`);
  next();
}
