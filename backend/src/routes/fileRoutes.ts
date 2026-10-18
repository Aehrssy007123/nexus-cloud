import { Router } from 'express';
import multer from 'multer';
import {
  listFiles,
  uploadFile,
  downloadFile,
  renameFile,
  deleteFile,
} from '../controllers/fileController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Store files in memory so controller can pipe them directly into WebHDFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max per single file
  },
});

router.use(authenticateToken);

router.get('/', listFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/:id/download', downloadFile);
router.patch('/:id', renameFile);
router.delete('/:id', deleteFile);

export default router;
