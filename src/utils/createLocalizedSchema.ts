import { LANGS } from '@/constants';

export const createLocalizedSchema = () => {
    return LANGS.reduce((acc, lang) => {
        if (lang === 'ro') {
            acc[lang] = { type: String, required: true };
        } else {
            acc[lang] = { type: String };
        }
        return acc;
    }, {} as Record<string, any>);
};