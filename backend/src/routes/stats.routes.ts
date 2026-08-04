import { Router } from 'express';
import { getRouteStats } from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Protected admin route - requires authentication
// Note: This route provides sensitive booking statistics and should be restricted in production
router.get('/', requireAuth, getRouteStats);

export default router;
