import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '@/config/config';

type TokenPayload = {
    userId: string;
    role: string;
    iat?: number;
    exp?: number;
  };
  

export const createJWT = (payload: JwtPayload): string => {
    const options: SignOptions = {
        expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
    };
    const token = jwt.sign(payload, config.jwtSecret, options);
    return token;
};

export const verifyJWT = (token: string): TokenPayload => {
    const decoded = jwt.verify(token, config.jwtSecret);

    if (typeof decoded !== 'object' || !('userId' in decoded) || !('role' in decoded)) {
        throw new Error('Invalid token payload');
    }

    return decoded as TokenPayload;
};
