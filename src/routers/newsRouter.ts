import { validateHashId } from '@/middleware/validateHashId';
import { validateCreateNews, validateResult } from '@/middleware/validationMiddleware';
import { Router } from 'express';
import { createNews, deleteNews, getAllNews, getNews, updateNews } from '@/controllers/newsController';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        getAllNews,
        authorizePermissions('admin'),
    )
    .post(
        apiLimiter,
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
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteNews
    )
    .patch(
        apiLimiter,
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
    .get(
        apiLimiter, 
        getNews
    );

export default router;