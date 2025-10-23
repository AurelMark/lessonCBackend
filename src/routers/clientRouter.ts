import { getProfileData, resetPasswordClient } from '@/controllers/clientController';
import { getExamByGroups, getExamsByUserGroups } from '@/controllers/examController';
import { getLessonByClient, getLessonsByUserGroups } from '@/controllers/lessonController';
import { authenticateUser } from '@/middleware/authMiddleware';
import { apiLimiter } from '@/utils/helmetHandler';
import { Router } from 'express';


const router = Router();

router
    .route('/get-profile')
    .get(
        apiLimiter,
        authenticateUser,
        getProfileData
    );

router
    .route('/change-password')
    .post(
        apiLimiter,
        authenticateUser,
        resetPasswordClient
    );

router
    .route('/lesson')
    .get(
        apiLimiter,
        authenticateUser,
        getLessonsByUserGroups
    );

router
    .route('/lesson/:slug')
    .get(
        apiLimiter,
        authenticateUser,
        getLessonByClient
    );

router
    .route('/exam')
    .get(
        apiLimiter,
        authenticateUser,
        getExamsByUserGroups
    );

router
    .route('/exam/:slug')
    .get(
        apiLimiter,
        authenticateUser,
        getExamByGroups
    );

export default router;