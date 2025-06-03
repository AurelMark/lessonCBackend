import { validateHashId } from '@/middleware/validateHashId';
import { validateCreateNews, validateResult } from '@/middleware/validationMiddleware';
import { Router } from 'express';
import { createNews, deleteNews, getAllNews, getNews, updateNews } from '@/controllers/newsController';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';

const router = Router();

router
    .route('/')
    .get(
        statsLogger,
        authenticateUser,
        getAllNews,
        authorizePermissions('admin'),
    )
    .post(
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateCreateNews,
        validateResult,
        createNews
    );

router
    .route('/:hashId')
    .delete(
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteNews
    )
    .patch(
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        sanitizeBody,
        validateCreateNews,
        validateResult,
        updateNews
    );

router
    .route('/slug/:slug')
    .get(getNews);

export default router;