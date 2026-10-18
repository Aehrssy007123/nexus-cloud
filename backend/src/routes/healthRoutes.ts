import { Router } from 'express';
import { getHealth, getStorageHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealth);
router.get('/storage', getStorageHealth);

export default router;
