import type { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service.js';
import { err } from '../utils/logger.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { fullName, email, phone, password } = req.body as Record<string, string>;

  if (!fullName?.trim() || !email?.trim() || !password) {
    res.status(400).json({ success: false, error: 'fullName, email, and password are required.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    return;
  }

  try {
    const result = await registerUser({ fullName, email, phone, password });
    
    // Set HTTP-only secure cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({ success: true, user: result.user });
  } catch (e) {
    if (e instanceof Error && e.message === 'EMAIL_EXISTS') {
      res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }
    err('AUTH', 'Registration failed.', e);
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as Record<string, string>;

  if (!email?.trim() || !password) {
    res.status(400).json({ success: false, error: 'email and password are required.' });
    return;
  }

  try {
    const result = await loginUser({ email, password });
    
    // Set HTTP-only secure cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({ success: true, user: result.user });
  } catch (e) {
    if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }
    err('AUTH', 'Login failed.', e);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  // User is already attached by requireAuth middleware
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated.' });
    return;
  }

  res.json({ 
    success: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName
    }
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // Clear HTTP-only cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true, message: 'Logged out.' });
}
