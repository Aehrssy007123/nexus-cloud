import { Router } from 'express';
import { listFolders, createFolder, deleteFolder } from '../controllers/folderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listFolders);
router.post('/', createFolder);
router.delete('/:id', deleteFolder);

export default router;
