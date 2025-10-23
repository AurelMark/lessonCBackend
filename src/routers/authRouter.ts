import { Router } from 'express';
import { validateLoginInput, validateOtpLogin, validateOtpRequest, validateResult } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { login, loginWithOtp, logout, requestOtpLogin } from '@/controllers/authController';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .post('/login',
        apiLimiter,
        sanitizeBody,
        validateLoginInput,
        validateResult,
        login
    );

router
    .get('/logout',
        apiLimiter,
        logout
    );

router
    .post('/request-otp',
        apiLimiter,
        sanitizeBody,
        validateOtpRequest,
        validateResult,
        requestOtpLogin
    );

router
    .post('/login-otp',
        apiLimiter,
        sanitizeBody,
        validateOtpLogin,
        validateResult,
        loginWithOtp
    );

export default router;