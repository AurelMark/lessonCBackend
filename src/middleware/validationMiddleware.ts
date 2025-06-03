import { decodeIdSafe } from '@/utils/idEncoder';
import { generateLocalizedValidations } from '@/utils/validationLang';
import { RequestHandler } from 'express';
import { body, validationResult, oneOf, query } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

const validRoles = ['user', 'client', 'teacher', 'journalist', 'assistant', 'admin'];

export const validateCreateNews = [
    ...generateLocalizedValidations(['title', 'description', 'content']),
    body('tags')
        .isArray({ min: 1 })
        .withMessage('Tags must be a non-empty array')
        .customSanitizer((tags) => {
            if (Array.isArray(tags)) {
                return tags.map((tag) =>
                    typeof tag === 'string' ? tag.trim().toLowerCase() : tag
                );
            }
            return tags;
        })
        .custom((tags) => {
            if (!Array.isArray(tags)) return false;
            for (const tag of tags) {
                if (typeof tag !== 'string' || tag.length === 0) {
                    throw new Error('Each tag must be a non-empty string');
                }
            }
            return true;
        }),
    body('imageUrl').trim().isString().notEmpty().withMessage('Image URL is required'),
];

export const validateCreateCourse = [
    ...generateLocalizedValidations(['title', 'description', 'content']),
    body('imageUrl').isString().trim().notEmpty().withMessage('Image URL is required'),
    body('features.lectures').isString().trim().notEmpty().withMessage('Lectures info is required'),
    body('features.quizzes').isString().trim().notEmpty().withMessage('Quizzes info is required'),
    body('features.duration').isNumeric().withMessage('Duration must be a number'),
    body('features.durationType').isString().trim().notEmpty().withMessage('Duration Type is required'),
    body('features.skillLevel').isString().trim().notEmpty().withMessage('Skill Level is required'),
    body('features.language').isString().trim().notEmpty().withMessage('Language is required'),
    body('features.students').isNumeric().withMessage('Students must be a number'),
    body('features.asssessments').isBoolean().withMessage('Assessments must be a boolean'),
    body('alert').optional().isArray().withMessage('Alert must be an array'),
    body('alert.*.type').optional().isString().trim().notEmpty().withMessage('Alert type is required'),
    body('alert.*.color').optional().isString().trim().notEmpty().withMessage('Alert color is required'),
    body('alert.*.content.ro').optional().isString().trim(),
    body('alert.*.content.ru').optional().isString().trim(),
    body('alert.*.content.en').optional().isString().trim(),
];

export const validateCreateSubCourse = [
    ...generateLocalizedValidations(['title', 'description']),
    body('imageUrl').isString().trim().notEmpty().withMessage('Image URL is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('courseSlug')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Course slug must be a non-empty string if provided'),
];

export const validateRenameFile = [
    body('oldName')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Old filename is required'),

    body('newName')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('New filename is required')
        .isLength({ min: 2 })
        .withMessage('New filename must be at least 2 characters long'),
];

const allowedPaths = {
    public: ['blog', 'course', 'subcourse'],
    private: ['lesson', 'examen', 'stats', 'user'],
};

export const validateCreateFolder = [
    body('scope')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Scope is required')
        .isIn(['public', 'private'])
        .withMessage('Scope must be either "public" or "private"'),

    body('category')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .custom((value, { req }) => {
            const scope = req.body.scope as 'public' | 'private';
            if (!scope || !allowedPaths[scope]?.includes(value)) {
                throw new Error('Invalid category for this scope');
            }
            return true;
        }),

    body('name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
];


export const validateCreateUser = [
    body('login')
        .isString().trim().notEmpty().withMessage('Login is required'),

    body('email')
        .isEmail().withMessage('Valid email is required'),

    body('password')
        .isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),

    body('firstName')
        .isString().trim().notEmpty().withMessage('First name is required'),

    body('lastName')
        .isString().trim().notEmpty().withMessage('Last name is required'),

    body('role')
        .optional()
        .isIn(['user', 'client', 'teacher', 'journalist', 'assistant', 'admin'])
        .withMessage('Invalid role'),

    body('groups')
        .optional()
        .isArray().withMessage('Groups must be an array'),

    body('isTempAccount')
        .optional()
        .isBoolean(),

    body('otpCode')
        .optional()
        .isString().isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits'),

    body('otpExpiresAt')
        .optional()
        .isISO8601().withMessage('otpExpiresAt must be a valid ISO date'),
    body('isOtpLogin')
        .optional()
        .isBoolean(),
];

export const validateOtpCode = [
    body('login')
        .trim()
        .notEmpty()
        .withMessage('Login is required'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('A valid email is required'),

    body('otpCode')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP code must be 6 characters'),
];

export const validateResendOtpAndForgotPassword = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('login').isString().trim().notEmpty().withMessage('Login is required'),
];

export const validateResetPassword = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('login').isString().trim().notEmpty().withMessage('Login is required'),
    body('otpCode').isString().trim().notEmpty().withMessage('OTP code is required'),
    body('newPassword').isString().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

export const validateGenerateUsers = [
    body('count')
        .isInt({ min: 1, max: 100 })
        .withMessage('Count must be a number between 1 and 100'),

    body('baseLogin')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Base login is required'),

    body('baseEmail')
        .isString()
        .trim()
        .isEmail()
        .withMessage('Valid base email is required'),

    body('groups')
        .optional()
        .isArray()
        .withMessage('Groups must be an array')
        .custom((groupIds) => {
            for (const id of groupIds) {
                if (!Types.ObjectId.isValid(id)) {
                    throw new Error(`Invalid group ID: ${id}`);
                }
            }
            return true;
        }),
];

export const validateUpdateUser = [
    body('login')
        .optional()
        .isString().withMessage('Login must be a string')
        .trim(),

    body('email')
        .optional()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail({
            gmail_remove_dots: false
        }),

    body('firstName')
        .optional()
        .isString().withMessage('First name must be a string')
        .trim(),

    body('lastName')
        .optional()
        .isString().withMessage('Last name must be a string')
        .trim(),

    body('role')
        .optional()
        .isIn(validRoles).withMessage(`Role must be one of: ${validRoles.join(', ')}`),

    body('groups')
        .optional()
        .isArray().withMessage('Groups must be an array')
        .custom((groupIds) => {
            const invalidIds = groupIds.filter((id: string) => !decodeIdSafe(id));
            if (invalidIds.length) {
                throw new Error(`Invalid group ID: ${invalidIds[0]}`);
            }
            return true;
        }),
];

export const validateManyIds = [
    body('value')
        .isIn(['true', 'false'])
        .withMessage('value must be true or false'),

    body('ids')
        .isArray({ min: 1 })
        .withMessage('ids must be a non-empty array'),

    body('ids.*')
        .isString()
        .withMessage('Each id must be a string')
];

export const validateUpdateUserPublic = [
    body('login')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Login must be a non-empty string'),

    body('email')
        .optional()
        .isEmail()
        .normalizeEmail({
            gmail_remove_dots: false
        })
        .withMessage('Must be a valid email'),

    body('firstName')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('First name must be a non-empty string'),

    body('lastName')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Last name must be a non-empty string'),

    body().custom(body => {
        const allowedFields = ['login', 'email', 'firstName', 'lastName'];
        const invalidFields = Object.keys(body).filter(key => !allowedFields.includes(key));
        if (invalidFields.length > 0) {
            throw new Error(`Unexpected fields: ${invalidFields.join(', ')}`);
        }
        return true;
    }),
];

export const validateLoginInput = [
    oneOf([
        body('email')
            .isEmail()
            .withMessage('Valid email is required'),
        body('login')
            .isString()
            .notEmpty()
            .withMessage('Login is required'),
    ], {
        message: 'Either email or login must be provided',
    }),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

export const validateOtpRequest = [
    body('email')
        .optional()
        .isEmail().withMessage('Invalid email format'),
    body('login')
        .optional()
        .isString().withMessage('Login must be a string'),
    body().custom((body) => {
        if (!body.email && !body.login) {
            throw new Error('Either email or login must be provided');
        }
        return true;
    })
];

export const validateOtpLogin = [
    ...validateOtpRequest,
    body('otpCode')
        .isLength({ min: 4, max: 8 })
        .withMessage('OTP code must be between 4 and 8 characters'),
];

export const validateCreateGroup = [
    ...generateLocalizedValidations(['title']),
    body('responsible')
        .isArray({ min: 1 })
        .withMessage('Responsible must be a non-empty array of user IDs'),
    body('responsible.*')
        .isString()
        .withMessage('Each responsible user ID must be a string')
        .custom((value) => {
            const decoded = decodeIdSafe(value);
            if (!decoded) {
                throw new Error('Each responsible user ID must be valid');
            }
            return true;
        }),
    body('createdBy')
        .isString()
        .withMessage('createdBy must be a string')
        .custom((value) => {
            const decoded = decodeIdSafe(value);
            if (!decoded) {
                throw new Error('Valid createdBy user ID is required');
            }
            return true;
        }),
    body('users').optional().isArray(),
    body('users.*')
        .optional()
        .isMongoId()
        .withMessage('Each user ID must be a valid Mongo ID'),
    body('lessons').optional().isArray(),
    body('lessons.*')
        .optional()
        .isMongoId()
        .withMessage('Each lesson ID must be a valid Mongo ID'),
    body('exams').optional().isArray(),
    body('exams.*')
        .optional()
        .isMongoId()
        .withMessage('Each exam ID must be a valid Mongo ID'),
];

export const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const validateCreateLesson = [
    ...generateLocalizedValidations(['title', 'description', 'content']),
    body('imageUrl')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Image URL is required'),
    body('slug')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Slug is required'),
    body('createdBy')
        .isString()
        .withMessage('createdBy must be a string')
        .custom((value) => {
            const decoded = decodeIdSafe(value);
            if (!decoded) {
                throw new Error('Valid createdBy user ID is required');
            }
            return true;
        }),
    body('materials')
        .isArray()
        .withMessage('Materials must be an array')
        .custom((materials) => {
            for (const m of materials) {
                if (
                    !m.name || typeof m.name !== 'string' ||
                    !m.type || typeof m.type !== 'string' ||
                    !m.url || typeof m.url !== 'string'
                ) {
                    throw new Error('Each material must contain valid name, type and url');
                }
            }
            return true;
        }),
    body('groups')
        .optional()
        .isArray()
        .withMessage('Groups must be an array of ObjectIds')
        .custom((groups) => {
            for (const id of groups) {
                if (typeof id !== 'string') throw new Error('Each group must be an ID string');
            }
            return true;
        }),
    body('examen')
        .optional()
        .isArray()
        .withMessage('Examen must be an array of ObjectIds')
        .custom((examen) => {
            for (const id of examen) {
                if (typeof id !== 'string') throw new Error('Each examen must be an ID string');
            }
            return true;
        }),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
];

export const validateCreateExam = [
    ...generateLocalizedValidations(['title', 'description', 'content']),
    body('imageUrl')
        .isString()
        .notEmpty()
        .withMessage('Image URL is required'),
    body('createdBy')
        .isString()
        .withMessage('createdBy must be a string')
        .custom((value) => {
            const decoded = decodeIdSafe(value);
            if (!decoded) throw new Error('Valid createdBy user ID is required');
            return true;
        }),
    body('responsible')
        .isArray({ min: 1 })
        .withMessage('Responsible must be a non-empty array of user IDs'),
    body('responsible.*')
        .isString()
        .withMessage('Each responsible user ID must be a string')
        .custom((value) => {
            const decoded = decodeIdSafe(value);
            if (!decoded) throw new Error('Each responsible user ID must be valid');
            return true;
        }),
    body('lessons').optional().isArray(),
    body('lessons.*')
        .optional()
        .isString()
        .withMessage('Each lesson ID must be a string')
        .custom((value) => {
            const decoded = decodeIdSafe(value);
            if (!decoded) throw new Error('Each lesson ID must be valid');
            return true;
        }),
    body('groups').optional().isArray(),
    body('groups.*')
        .optional()
        .isString()
        .withMessage('Each group ID must be a string')
        .custom((value) => {
            const decoded = decodeIdSafe(value);
            if (!decoded) throw new Error('Each group ID must be valid');
            return true;
        }),
    body('questions')
        .isArray({ min: 1 })
        .withMessage('Questions must be a non-empty array'),
    body('questions.*.title')
        .isString()
        .notEmpty()
        .withMessage('Each question must have a title'),
    body('questions.*.options')
        .isArray({ min: 1 })
        .withMessage('Each question must have at least one option'),
    body('questions.*.options.*.content')
        .isString()
        .notEmpty()
        .withMessage('Each option must have content'),
    body('questions.*.options.*.isAnswer')
        .isBoolean()
        .withMessage('Each option must have a boolean isAnswer flag'),
    body('questions.*.options.*.order')
        .isInt({ min: 0 })
        .withMessage('Each option must have a numeric order'),
    body('questions.*.order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Question order must be a number'),
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage('Deadline must be a valid ISO date'),
    body('timer')
        .optional()
        .isString()
        .withMessage('Timer must be a string'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
];

export const validateSubmitExam = [
    body('examId')
        .isString().withMessage('examId must be a string')
        .custom(value => {
            if (!decodeIdSafe(value)) throw new Error('Invalid exam ID');
            return true;
        }),
    body('userId')
        .isString().withMessage('userId must be a string')
        .custom(value => {
            if (!decodeIdSafe(value)) throw new Error('Invalid user ID');
            return true;
        }),
    body('answers')
        .isArray({ min: 1 }).withMessage('answers must be a non-empty array'),
    body('answers.questionIndex')
        .isInt({ min: 0 }).withMessage('Each answer must have a valid questionIndex'),
    body('answers.selectedOptionIndex')
        .isInt({ min: 0 }).withMessage('Each answer must have a valid selectedOptionIndex'),
];

export const validateContacts = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ min: 5 }).withMessage('Message must be at least 5 characters'),
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone is required')
        .matches(/^\+?[0-9\s\-]{7,15}$/).withMessage('Phone number is invalid'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Valid email is required')
];

export const validateSendContactReply = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address'),

    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),

    body('subject')
        .trim()
        .notEmpty().withMessage('Subject is required')
        .isLength({ min: 3 }).withMessage('Subject must be at least 3 characters'),

    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ min: 5 }).withMessage('Message must be at least 5 characters')
];

export const validateResult: RequestHandler = (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        const formattedErrors = result.array().map((err) => {
            if ('path' in err) {
                return {
                    field: err.path,
                    message: err.msg,
                };
            }
            return {
                field: 'unknown',
                message: err.msg,
            };
        });

        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: formattedErrors,
        });
        return;
    }

    next();
};

