import { Router } from 'express';
import { createUser, deleteUser, forgotPassword, generateUsers, getAllUsers, getUser, getUserById, patchUser, resendOtpCode, resetPassword, toggleManyUserStatus, toggleUserActiveStatus, updateMyselfUserData, verifyOtpCode } from '@/controllers/userController';
import { validateCreateUser, validateGenerateUsers, validateManyIds, validateOtpCode, validateResendOtpAndForgotPassword, validateResetPassword, validateResult, validateUpdateUser, validateUpdateUserPublic } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { validateHashId } from '@/middleware/validateHashId';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .get('/',
        apiLimiter,
        statsLogger,
        authenticateUser,
        sanitizeBody,
        getAllUsers
    )
    .post('/',
        apiLimiter,
        statsLogger,
        authenticateUser,
        sanitizeBody,
        authorizePermissions('admin'),
        validateCreateUser,
        validateResult,
        createUser
    );

router
    .post('/verify',
        apiLimiter,
        statsLogger,
        validateOtpCode,
        validateResult,
        verifyOtpCode
    );

router
    .post('/resend-otp',
        apiLimiter,
        statsLogger,
        validateResendOtpAndForgotPassword,
        validateResult,
        resendOtpCode
    );

router
    .post('/forgot-password',
        apiLimiter,
        statsLogger,
        validateResendOtpAndForgotPassword,
        validateResult,
        forgotPassword
    );
router
    .post('/reset-password',
        apiLimiter,
        statsLogger,
        validateResetPassword,
        validateResult,
        resetPassword
    );

router
    .post('/generate',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateGenerateUsers,
        generateUsers
    );

router
    .get('/profile',
        apiLimiter,
        statsLogger,
        authenticateUser,
        sanitizeBody,
        getUser);

router
    .patch('/profile/:hashId',
        apiLimiter,
        statsLogger,
        authenticateUser,
        validateHashId(),
        sanitizeBody,
        validateUpdateUserPublic,
        validateResult,
        updateMyselfUserData);

router
    .patch('/activate',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateManyIds,
        validateResult,
        toggleManyUserStatus
    );

router
    .get('/:hashId',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        getUserById
    )
    .patch('/:hashId',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        validateUpdateUser,
        validateResult,
        patchUser
    )
    .delete('/:hashId',
        apiLimiter,
        statsLogger,
        authenticateUser,
        validateHashId(),
        deleteUser);

router
    .patch('/:hashId/activate',
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        toggleUserActiveStatus
    );

export default router;
