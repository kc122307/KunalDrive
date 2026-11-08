import express from 'express';
import { getStorageSummary } from '../controllers/storageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/summary', getStorageSummary);

export default router;
