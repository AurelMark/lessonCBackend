import { BadRequestError } from '@/errors/customErrors';
import crypto from 'crypto';

const SECRET = process.env.HASH_SECRET || 'default_secret_key';
const algorithm = 'aes-256-cbc';
const key = crypto.createHash('sha256').update(SECRET).digest();
const iv = Buffer.alloc(16, 0);

export const encodeId = (id: string): string => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(id, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export const decodeIdSafe = (encryptedId: string): string => {
    try {
        const base64 = encryptedId
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(padded, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('❌ Error decoding id:', error);
        throw new BadRequestError('Invalid id provided');
    }
};