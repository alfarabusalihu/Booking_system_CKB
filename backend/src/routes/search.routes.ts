import { Router } from 'express';
import { searchTrains } from '../controllers/search.controller.js';

const router = Router();

router.get('/', searchTrains);

export default router;
