import { Router } from 'express';
import { validateCreateExam, validatePagination, validateResult, validateSubmitExam } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { createExam, deleteExam, getAllExams, getExam, getExamsWithAttempts, submitExam, updateExam } from '@/controllers/examController';
import { validateHashId } from '@/middleware/validateHashId';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        authenticateUser,
        statsLogger,
        sanitizeBody,
        validatePagination,
        validateResult,
        getAllExams)
    .post(
        apiLimiter,
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        validateCreateExam,
        validateResult,
        createExam
    );

router
    .route('/submit')
    .post(
        apiLimiter,
        statsLogger,
        authenticateUser,
        sanitizeBody,
        validateSubmitExam,
        validateResult,
        submitExam
    );

router
    .route('/attempts')
    .get(
        apiLimiter,
        authenticateUser,
        statsLogger,
        sanitizeBody,
        authorizePermissions('admin'),
        validatePagination,
        validateResult,
        getExamsWithAttempts
    );

router
    .route('/:slug')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        sanitizeBody,
        getExam
    );

router
    .route('/:hashId')
    .delete(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteExam
    )
    .patch(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        sanitizeBody,
        validateCreateExam,
        validateResult,
        updateExam
    );

export default router;