import express from 'express';
import {
  createShare,
  getSharesForFile,
  revokeShare,
  getSharedItemByToken
} from '../controllers/shareController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public token view endpoint
router.get('/public/:token', getSharedItemByToken);

// Protected share management
router.use(authenticate);

router.post('/', createShare);
router.get('/file/:fileId', getSharesForFile);
router.delete('/:id', revokeShare);

export default router;
