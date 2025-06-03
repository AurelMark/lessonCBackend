import { RequestHandler } from 'express';
import { decodeIdSafe } from '@/utils/idEncoder';
import { BadRequestError } from '@/errors/customErrors';

declare global {
    namespace Express {
        interface Request {
            realId?: string;
        }
    }
}

export const validateHashId = (paramName = 'hashId'): RequestHandler => {
    return (req, _res, next) => {
        const encryptedId = req.params[paramName];

        const decoded = decodeIdSafe(encryptedId);

        if (!decoded) {
            throw new BadRequestError('Invalid id provided');
        }

        req.realId = decoded;
        next();
    };
};
