import rateLimiter from 'express-rate-limit';

export const apiLimiter = rateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 250,
    message: { status: 429, message: 'IP rate limit exceeded, retry in 15 minutes.' },
});