import express from 'express';
import {
  listFiles,
  uploadFiles,
  resumableInit,
  resumableChunk,
  downloadFile,
  streamFile,
  getFileDetails,
  renameFile,
  moveFile,
  copyFile,
  toggleStar,
  trashFile,
  restoreFile,
  deleteFilePermanent,
  emptyTrash,
  searchFiles,
  downloadBatchZip,
  batchMove,
  batchStar
} from '../controllers/fileController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = express.Router();

// Public / Token-accessible endpoints (for media streaming, direct download with token)
router.get('/:id/stream', optionalAuthenticate, streamFile);
router.get('/:id/download', optionalAuthenticate, downloadFile);

// Resumable raw binary chunk endpoint (needs raw body parser)
router.put('/upload/chunk/:sessionId', express.raw({ type: '*/*', limit: '100mb' }), resumableChunk);

// Protected endpoints
router.use(authenticate);

router.get('/', listFiles);
router.get('/search', searchFiles);
router.post('/upload', uploadMiddleware.array('files', 50), uploadFiles);
router.post('/upload/init', resumableInit);

router.post('/trash/empty', emptyTrash);
router.post('/download-batch', downloadBatchZip);
router.post('/batch-move', batchMove);
router.post('/batch-star', batchStar);

router.get('/:id', getFileDetails);
router.patch('/:id/rename', renameFile);
router.patch('/:id/move', moveFile);
router.post('/:id/copy', copyFile);
router.post('/:id/star', toggleStar);
router.post('/:id/trash', trashFile);
router.post('/:id/restore', restoreFile);
router.delete('/:id/permanent', deleteFilePermanent);

export default router;

