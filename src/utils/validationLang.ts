import { body } from 'express-validator';
import { LANGS } from '@/constants';

export const generateLocalizedValidations = (fields: string[]) => {
    return fields.flatMap((field) =>
        LANGS.map((lang) => {
            const chain = body(`${field}.${lang}`).isString().trim();
            return lang === 'ro'
                ? chain.notEmpty().withMessage(`${field} (${lang}) is required`)
                : chain.optional();
        })
    );
};