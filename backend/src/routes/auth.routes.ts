import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
