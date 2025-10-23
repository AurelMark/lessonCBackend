import { createContact, deleteContact, getAllContacts, sendContactReply } from '@/controllers/contactsController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { statsLogger } from '@/middleware/statsLogger';
import { validateHashId } from '@/middleware/validateHashId';
import { validateContacts, validateResult, validateSendContactReply } from '@/middleware/validationMiddleware';
import { apiLimiter } from '@/utils/helmetHandler';
import { Router } from 'express';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        authenticateUser,
        authorizePermissions('admin'),
        statsLogger,
        getAllContacts)
    .post(
        apiLimiter, sanitizeBody,
        validateContacts,
        validateResult,
        createContact
    );

router
    .route('/reply')
    .post(
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateSendContactReply,
        validateResult,
        sendContactReply
    );

router
    .route('/:hashId')
    .delete(
        apiLimiter,
        validateHashId(),
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        deleteContact
    );




export default router;