import express from 'express';
import {
  createFolder,
  getBreadcrumbs,
  getFolderTree,
  renameFolder,
  moveFolder,
  downloadFolderZip
} from '../controllers/folderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createFolder);
router.get('/tree', getFolderTree);
router.get('/breadcrumbs/:folderId', getBreadcrumbs);
router.patch('/:id/rename', renameFolder);
router.patch('/:id/move', moveFolder);
router.get('/:id/download-zip', downloadFolderZip);

export default router;
