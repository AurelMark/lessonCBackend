import { Router } from 'express';
import { validateCreateExam, validatePagination, validateResult, validateSubmitExam } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { createExam, deleteExam, getAllExams, getExam, submitExam, updateExam } from '@/controllers/examController';
import { validateHashId } from '@/middleware/validateHashId';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';

const router = Router();

router
    .route('/')
    .get(
        authenticateUser,
        statsLogger,
        sanitizeBody,
        validatePagination,
        validateResult,
        getAllExams)
    .post(
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
        statsLogger,
        authenticateUser,
        sanitizeBody,
        validateSubmitExam,
        validateResult,
        submitExam
    );

router
    .route('/:slug')
    .get(
        statsLogger,
        authenticateUser,
        sanitizeBody,
        getExam
    );

router
    .route('/:hashId')
    .delete(
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteExam
    )
    .patch(
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