import { UnauthenticatedError, UnauthorizedError } from '@/errors/customErrors';
import { TRole } from '@/models/UserModel';
import { verifyJWT } from '@/utils/tokenUtils';
import { Request, Response, NextFunction } from 'express';


type AuthenticatedRequest = Request & {
    user?: {
        userId: string;
        role: TRole;
    };
};

const isTRole = (role: any): role is TRole =>
    ['user', 'client', 'teacher', 'journalist', 'assistant', 'admin'].includes(role);

export const authenticateUser = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    const { token } = req.cookies;

    if (!token) {
        throw new UnauthenticatedError('authentication invalid');
    }

    try {
        const payload = verifyJWT(token);

        const userId = payload.userId as string;
        const role = payload.role;

        if (!userId || !isTRole(role)) {
            throw new UnauthenticatedError('authentication invalid');
        }

        req.user = { userId, role };
        next();
    } catch {
        throw new UnauthenticatedError('authentication invalid');
    }
};

export const authorizePermissions = (...roles: TRole[]) => {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new UnauthorizedError('Unauthorized to access this route');
        }
        next();
    };
};
