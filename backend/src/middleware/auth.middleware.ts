import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
      };
    }
  }
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = readBearerToken(req);
  
  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  const payload = await verifyAuthToken(token);
  
  if (!payload) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    fullName: payload.fullName,
  };

  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = readBearerToken(req);
  
  if (token) {
    const payload = await verifyAuthToken(token);
    if (payload) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        fullName: payload.fullName,
      };
    }
  }

  next();
}
