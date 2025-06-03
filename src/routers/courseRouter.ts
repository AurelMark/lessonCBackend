import { createCourse, createSubCourse, deleteCourse, deleteSubCourse, getAllCourses, getAllSubCourses, getCourse, getSubCourse, updateCourse, updateSubCourse } from '@/controllers/courseController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { statsLogger } from '@/middleware/statsLogger';
import { validateHashId } from '@/middleware/validateHashId';
import { validateCreateCourse, validateCreateSubCourse, validateResult } from '@/middleware/validationMiddleware';
import { Router } from 'express';

const router = Router();

router
    .route('/')
    .get(getAllCourses)
    .post(
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
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        deleteCourse
    )
    .patch(
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        updateCourse
    );

router
    .route('/slug/:slug')
    .get(getCourse);

router
    .route('/slug/:courseSlug/subcourses')
    .get(getAllSubCourses)
    .post(
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
        validateHashId(),
        sanitizeBody,
        getSubCourse
    ).patch(
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        updateSubCourse
    )
    .delete(
        validateHashId(),
        authenticateUser,
        statsLogger,
        authorizePermissions('admin'),
        sanitizeBody,
        deleteSubCourse,
    );

export default router;