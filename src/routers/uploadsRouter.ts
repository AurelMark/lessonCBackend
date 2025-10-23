import { listPublicUploads, listUploads, listPrivateUploads, getPublicFolderContent, getPrivateFolderContent, createFolder, deleteFolder, uploadFiles, deleteFile, deleteMultipleFiles, renameFile, streamPrivateFile, uploadFilesHomepage, deleteFileHomepage } from '@/controllers/uploadsController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { uploadMiddleware } from '@/middleware/uploadMiddleware';
import { validateCreateFolder, validateRenameFile, validateResult } from '@/middleware/validationMiddleware';
import { apiLimiter } from '@/utils/helmetHandler';
import { Router } from 'express';

const router = Router();

router
    .get('/',
        apiLimiter,
        authenticateUser,
        statsLogger,
        listUploads
    )
    .post('/',
        apiLimiter,
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        validateCreateFolder,
        validateResult,
        createFolder
    );

router
    .get('/public/',
        apiLimiter,
        statsLogger,
        listPublicUploads
    );

router
    .get('/public/:slug/',
        apiLimiter,
        statsLogger,
        getPublicFolderContent);

router
    .delete('/:scope/:category/:filename',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        deleteFileHomepage
    );

router
    .get('/public/:slug/:nameFolder',
        apiLimiter,
        statsLogger,
        getPublicFolderContent
    );

router
    .get('/private/',
        apiLimiter,
        authenticateUser,
        statsLogger,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        listPrivateUploads
    );

router
    .get('/private/:slug/',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        getPrivateFolderContent
    );
router
    .get('/private/:slug/:nameFolder',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        getPrivateFolderContent
    );

router.get(
    '/private/:slug/:nameFolder/:filename',
    apiLimiter,
    authenticateUser,
    statsLogger,
    streamPrivateFile
);

router
    .post('/:scope/:category',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        uploadMiddleware,
        uploadFilesHomepage
    );

router
    .post('/:scope/:category/:folder',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        uploadMiddleware,
        uploadFiles
    )
    .delete('/:scope/:category/:folder',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        deleteFolder
    );

router
    .delete('/:scope/:category/:folder/multiple',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        deleteMultipleFiles
    );
router
    .patch('/:scope/:category/:folder/rename',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateRenameFile,
        validateResult,
        renameFile
    );
router
    .delete('/:scope/:category/:folder/:filename',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        deleteFile
    );

export default router;