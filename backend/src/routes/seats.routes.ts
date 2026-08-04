import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { getSeats, lockSeat, unlockSeat, validateReservations } from '../controllers/seats.controller.js';

const router = Router();

router.get('/', getSeats);
router.post('/lock', optionalAuth, lockSeat); // Use optionalAuth to attach user if authenticated
router.post('/unlock', unlockSeat);
router.post('/validate-reservations', requireAuth, validateReservations); // Protected: only authenticated users

export default router;
