import { createContact, deleteContact, sendContactReply } from '@/controllers/contactsController';
import { getAllCourses, } from '@/controllers/courseController';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { statsLogger } from '@/middleware/statsLogger';
import { validateHashId } from '@/middleware/validateHashId';
import { validateContacts, validateResult, validateSendContactReply } from '@/middleware/validationMiddleware';
import { Router } from 'express';

const router = Router();

router
    .route('/')
    .get(authenticateUser, authorizePermissions('admin'), statsLogger, getAllCourses)
    .post(
        sanitizeBody,
        validateContacts,
        validateResult,
        createContact
    );

router
    .route('/:hashId')
    .delete(
        validateHashId(),
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        deleteContact
    );

router
    .post(
        '/contacts/reply',
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateSendContactReply,
        validateResult,
        sendContactReply
    );


export default router;