import { getAllStatsLogs } from '@/controllers/statsController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { apiLimiter } from '@/utils/helmetHandler';
import express from 'express';

const router = express.Router();

router
    .get('/',
        apiLimiter,
        authenticateUser,
        authorizePermissions('admin'),
        getAllStatsLogs
    );

export default router;
