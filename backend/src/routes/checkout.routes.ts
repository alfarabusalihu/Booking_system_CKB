import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getTicketDataHandler,
  checkIdentificationHandler,
} from '../controllers/checkout.controller.js';

const router = Router();

// Get ticket data after successful payment (protected route)
// Note: Real Stripe payment routes removed - see STRIPE_INTEGRATION_GUIDE.md for production setup
router.post('/ticket-data', requireAuth, getTicketDataHandler);

// Check if identification number is available for booking
router.post('/check-identification', checkIdentificationHandler);

export default router;
