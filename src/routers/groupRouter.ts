import { Router } from 'express';
import { createGroup, deleteGroup, getAllGroups, getGroupById, updateGroup } from '@/controllers/groupController';
import { validateCreateGroup, validatePagination, validateResult } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { validateHashId } from '@/middleware/validateHashId';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';

const router = Router();

router
    .route('/')
    .get(
        statsLogger,
        authenticateUser,
        validatePagination,
        validateResult,
        getAllGroups
    )
    .post(
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        validateCreateGroup,
        validateResult,
        createGroup
    );

router
    .get(
        '/:hashId',
        statsLogger,
        validateHashId(),
        authenticateUser,
        sanitizeBody,
        getGroupById
    )
    .patch(
        '/:hashId',
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        sanitizeBody,
        validateCreateGroup,
        validateResult,
        updateGroup
    )
    .delete(
        '/:hashId',
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteGroup
    );

export default router;
