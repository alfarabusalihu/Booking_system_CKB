import { Router } from 'express';
import { getSeats, lockSeat, unlockSeat } from '../controllers/seats.controller.js';

const router = Router();

router.get('/', getSeats);
router.post('/lock', lockSeat);
router.post('/unlock', unlockSeat);

export default router;
