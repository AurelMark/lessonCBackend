import { Router } from 'express';
import { createGroup, deleteGroup, getAllGroups, getGroupById, updateGroup } from '@/controllers/groupController';
import { validateCreateGroup, validatePagination, validateResult } from '@/middleware/validationMiddleware';
import { sanitizeBody } from '@/middleware/sanitizeBody';
import { validateHashId } from '@/middleware/validateHashId';
import { authenticateUser, authorizePermissions } from '@/middleware/authMiddleware';
import { statsLogger } from '@/middleware/statsLogger';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter,
        statsLogger,
        authenticateUser,
        validatePagination,
        validateResult,
        getAllGroups
    )
    .post(
        apiLimiter,
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
        apiLimiter,
        statsLogger,
        validateHashId(),
        authenticateUser,
        authorizePermissions('admin'),
        sanitizeBody,
        getGroupById
    )
    .patch(
        '/:hashId',
        apiLimiter,
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
        apiLimiter,
        statsLogger,
        authenticateUser,
        authorizePermissions('admin'),
        validateHashId(),
        deleteGroup
    );

export default router;
