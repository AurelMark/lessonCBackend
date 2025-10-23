import { Router } from 'express';
import { validateHomepageData, validateResult } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { getHomepage, UpdateHomepage } from '@/controllers/homepageController';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        statsLogger,
        getHomepage
    )
    .patch(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateHomepageData,
        validateResult,
        UpdateHomepage
    );

export default router;
