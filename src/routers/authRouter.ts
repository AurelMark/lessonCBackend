import { Router } from 'express';
import { validateLoginInput, validateOtpLogin, validateOtpRequest, validateResult } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { login, loginWithOtp, logout, requestOtpLogin } from '@/controllers/authController';

const router = Router();

router
    .post('/login', sanitizeBody, validateLoginInput, validateResult, login);

router
    .get('/logout', logout);

router
    .post('/request-otp', sanitizeBody, validateOtpRequest, validateResult, requestOtpLogin);

router
    .post('/login-otp', sanitizeBody, validateOtpLogin, validateResult, loginWithOtp);

export default router;