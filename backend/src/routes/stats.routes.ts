import { Router } from 'express';
import { getRouteStats } from '../controllers/stats.controller.js';

const router = Router();
router.get('/', getRouteStats);
export default router;
