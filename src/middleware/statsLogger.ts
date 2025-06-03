import { Request, Response, NextFunction } from 'express';
import { UAParser } from 'ua-parser-js';
import StatsLogModel from '@/models/StatsLogModel';

export const statsLogger = async (req: Request, _res: Response, next: NextFunction) => {
    const parser = new UAParser(req.headers['user-agent'] || '');
    const ua = parser.getResult();

    const ip =
        req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.socket.remoteAddress ||
        '';

    const logData: any = {
        ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        os: ua.os.name || '',
        browser: ua.browser.name || '',
        deviceType: ua.device.type || 'desktop',
        status: 'success',
    };

    if ((req as any).user?.login) {
        logData.login = (req as any).user.login;
    }

    try {
        await StatsLogModel.create(logData);
    } catch (err) {
        console.error('Failed to log request stats:', err);
    }

    next();
};
