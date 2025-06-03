import { getAllStatsLogs } from '@/controllers/statsController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import express from 'express';

const router = express.Router();

router
    .get('/',
        authenticateUser,
        authorizePermissions('admin'),
        getAllStatsLogs
    );

export default router;
