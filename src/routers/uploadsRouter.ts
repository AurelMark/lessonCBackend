import { listPublicUploads, listUploads, listPrivateUploads, getPublicFolderContent, getPrivateFolderContent, createFolder, deleteFolder, uploadFiles, deleteFile, deleteMultipleFiles, renameFile } from '@/controllers/uploadsController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { uploadMiddleware } from '@/middleware/uploadMiddleware';
import { validateCreateFolder, validateRenameFile, validateResult } from '@/middleware/validationMiddleware';
import { Router } from 'express';

const router = Router();

router
    .get('/', authenticateUser, statsLogger, listUploads)
    .post('/', authenticateUser, statsLogger, authorizePermissions('admin'), validateCreateFolder, validateResult, createFolder);

router
    .get('/public/', listPublicUploads);

router
    .get('/public/:slug/:nameFolder', getPublicFolderContent);


router
    .get('/private/', statsLogger, authenticateUser, listPrivateUploads);

router
    .get('/private/:slug/:nameFolder', statsLogger, authenticateUser, getPrivateFolderContent);

router
    .post('/:scope/:category/:folder', statsLogger, authenticateUser, authorizePermissions('admin'), uploadMiddleware, uploadFiles)
    .delete('/:scope/:category/:folder', statsLogger, authenticateUser, authorizePermissions('admin'), deleteFolder);

router
    .delete('/:scope/:category/:folder/multiple', statsLogger, authenticateUser, authorizePermissions('admin'), deleteMultipleFiles);
router
    .patch('/:scope/:category/:folder/rename', statsLogger, authenticateUser, authorizePermissions('admin'), validateRenameFile, validateResult, renameFile);
router
    .delete('/:scope/:category/:folder/:filename', statsLogger, authenticateUser, authorizePermissions('admin'), deleteFile);

export default router;