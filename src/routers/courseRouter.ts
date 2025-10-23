import { createCourse, createSubCourse, deleteCourse, deleteSubCourse, getAllCourses, getAllSubCourses, getCourse, getSubCourse, updateCourse, updateSubCourse } from '@/controllers/courseController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { statsLogger } from '@/middleware/statsLogger';
import { validateHashId } from '@/middleware/validateHashId';
import { validateCreateCourse, validateCreateSubCourse, validateResult } from '@/middleware/validationMiddleware';
import { apiLimiter } from '@/utils/helmetHandler';
import { Router } from 'express';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        getAllCourses
    )
    .post(
        apiLimiter,
        authenticateUser,
        authorizePermissions('admin'),
        statsLogger,
        sanitizeBody,
        validateCreateCourse,
        validateResult,
        createCourse
    );

router
    .route('/:hashId')
    .delete(
        apiLimiter,
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        deleteCourse
    )
    .patch(
        apiLimiter,
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        updateCourse
    );

router
    .route('/slug/:slug')
    .get(
        apiLimiter,
        getCourse
    );

router
    .route('/slug/:courseSlug/subcourses')
    .get(
        apiLimiter,
        getAllSubCourses
    )
    .post(
        apiLimiter,
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        validateCreateSubCourse,
        validateResult,
        createSubCourse,
    );

router
    .route('/slug/:courseSlug/subcourses/:hashId')
    .get(
        apiLimiter,
        validateHashId(),
        sanitizeBody,
        getSubCourse
    ).patch(
        apiLimiter,
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        updateSubCourse
    )
    .delete(
        apiLimiter,
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        deleteSubCourse,
    );

export default router;