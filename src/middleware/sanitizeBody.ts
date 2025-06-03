import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { Request, Response, NextFunction } from 'express';

function sanitizeRecursively(obj: any): any {
    if (typeof obj === 'string') {
        return sanitizeHtml(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeRecursively(item));
    }

    if (obj && typeof obj === 'object') {
        const sanitizedObj: Record<string, any> = {};
        for (const key in obj) {
            sanitizedObj[key] = sanitizeRecursively(obj[key]);
        }
        return sanitizedObj;
    }

    return obj;
}

export const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeRecursively(req.body);
    }
    next();
};
