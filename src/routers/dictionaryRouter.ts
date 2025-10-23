import { Router } from 'express';
import { getAllExams, getAllGroups, getAllLessons, getAllTags, getAllUsers } from '@/controllers/dictionaryController';
import { statsLogger } from '@/middleware/statsLogger';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/get-blog-tags')
    .get(
        apiLimiter,
        getAllTags
    );

router.route('/get-exams')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        getAllExams
    );

router.route('/get-lessons')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        getAllLessons
    );

router.route('/get-users')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        getAllUsers
    );

router.route('/get-groups')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        getAllGroups
    );

export default router;