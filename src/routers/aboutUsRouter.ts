import { Router } from 'express';
import { validateCreateAboutUs, validateResult } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { getAboutUs, UpdateAboutUs } from '@/controllers/aboutUsController';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        statsLogger,
        getAboutUs
    )
    .patch(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateCreateAboutUs,
        validateResult,
        UpdateAboutUs
    );

export default router;
