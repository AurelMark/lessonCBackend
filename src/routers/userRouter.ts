import { Router } from 'express';
import { createUser, deleteUser, forgotPassword, generateUsers, getAllUsers, getUser, patchUser, resendOtpCode, resetPassword, toggleManyUserStatus, toggleUserActiveStatus, updateMyselfUserData, verifyOtpCode } from '@/controllers/userController';
import { validateCreateUser, validateGenerateUsers, validateManyIds, validateOtpCode, validateResendOtpAndForgotPassword, validateResetPassword, validateResult, validateUpdateUser, validateUpdateUserPublic } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { validateHashId } from '@/middleware/validateHashId';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';

const router = Router();

router
    .get('/', statsLogger, authenticateUser, sanitizeBody, getAllUsers)
    .post('/', statsLogger, authenticateUser, sanitizeBody, validateCreateUser, validateResult, createUser);

router
    .post('/verify', statsLogger, validateOtpCode, validateResult, verifyOtpCode);

router
    .post('/resend-otp', statsLogger, validateResendOtpAndForgotPassword, validateResult, resendOtpCode);

router
    .post('/forgot-password', statsLogger, validateResendOtpAndForgotPassword, validateResult, forgotPassword);
router
    .post('/reset-password', statsLogger, validateResetPassword, validateResult, resetPassword);

router
    .post('/generate', statsLogger, authenticateUser, authorizePermissions('admin'), validateGenerateUsers, generateUsers);

router
    .get('/profile', statsLogger, authenticateUser, sanitizeBody, getUser);

router
    .patch('/profile/:hashId', statsLogger, authenticateUser, validateHashId(), authorizePermissions('admin'), sanitizeBody, validateUpdateUserPublic, validateResult, updateMyselfUserData);

router
    .patch('/activate', statsLogger, authenticateUser, authorizePermissions('admin'), validateManyIds, validateResult, toggleManyUserStatus);

router
    .patch('/:hashId', statsLogger, authenticateUser, authorizePermissions('admin'), validateHashId(), validateUpdateUser, validateResult, patchUser)
    .delete('/:hashId', statsLogger, authenticateUser, validateHashId(), deleteUser);

router
    .patch('/:hashId/activate', statsLogger, authorizePermissions('admin'), authenticateUser, validateHashId(), toggleUserActiveStatus);

export default router;
