import { createLesson, deleteLesson, getAllLessons, getLesson, updateLesson } from '@/controllers/lessonController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { statsLogger } from '@/middleware/statsLogger';
import { validateHashId } from '@/middleware/validateHashId';
import { validateCreateLesson, validatePagination, validateResult } from '@/middleware/validationMiddleware';
import { apiLimiter } from '@/utils/helmetHandler';
import { Router } from 'express';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        sanitizeBody,
        validatePagination,
        validateResult,
        getAllLessons)
    .post(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateCreateLesson,
        validateResult,
        createLesson
    );

router
    .route('/:slug')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        sanitizeBody,
        getLesson
    );

router
    .route('/:hashId')
    .delete(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteLesson
    )
    .patch(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        sanitizeBody,
        validateCreateLesson,
        validateResult,
        updateLesson);

export default router;