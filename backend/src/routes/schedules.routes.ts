import { Router } from 'express';
import { getSchedules } from '../controllers/schedules.controller.js';

const router = Router();

router.get('/', getSchedules);

export default router;
