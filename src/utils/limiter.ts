import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  keyGenerator: (req: Request, _res: Response): string => {
    return ipKeyGenerator(req.ip ?? '');
  },
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({ error: 'Too many requests' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
