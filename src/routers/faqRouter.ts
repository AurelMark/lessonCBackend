import { Router } from 'express';
import { validateFAQArray, validateResult } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { getFAQ, UpdateFAQ } from '@/controllers/faqcontroller';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        statsLogger,
        getFAQ
    )
    .patch(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateFAQArray,
        validateResult,
        UpdateFAQ
    );

export default router;
