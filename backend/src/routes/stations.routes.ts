import { Router } from 'express';
import { getStations } from '../controllers/stations.controller.js';

const router = Router();

router.get('/', getStations);

export default router;
