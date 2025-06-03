import { createLesson, deleteLesson, getAllLessons, getLesson, updateLesson } from '@/controllers/lessonController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { statsLogger } from '@/middleware/statsLogger';
import { validateHashId } from '@/middleware/validateHashId';
import { validateCreateLesson, validatePagination, validateResult } from '@/middleware/validationMiddleware';
import { Router } from 'express';

const router = Router();

router
    .route('/')
    .get(
        statsLogger,
        authenticateUser,
        sanitizeBody,
        validatePagination,
        validateResult,
        getAllLessons)
    .post(
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
        statsLogger,
        authenticateUser,
        sanitizeBody,
        getLesson
    );

router
    .route('/:hashId')
    .delete(
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteLesson
    )
    .patch(
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        sanitizeBody,
        validateCreateLesson,
        validateResult,
        updateLesson);

export default router;