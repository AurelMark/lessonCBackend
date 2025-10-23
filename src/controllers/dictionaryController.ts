import ExamModel from '@/models/ExamenModel';
import GroupModel from '@/models/GroupModel';
import LessonModel from '@/models/LessonModel';
import NewsModel from '@/models/NewsModel';
import UserModel from '@/models/UserModel';
import { catchAsync } from '@/utils/asyncHandler';
import { encodeId } from '@/utils/idEncoder';
import { omitFields, omitFieldsDeep } from '@/utils/omitFields';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const getAllTags = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const uniqueTags = await NewsModel.distinct('tags');
    res.status(StatusCodes.OK).json(uniqueTags);
});

export const getAllExams = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const exams = await ExamModel.find()
        .populate('groups', 'title')
        .populate('lessons', 'title imageUrl description slug')
        .populate('responsible', 'firstName lastName role email')
        .populate('createdBy', 'firstName lastName role email')
        .populate('attempts');

    res.status(StatusCodes.OK).json(exams);
});

export const getAllLessons = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const lessons = await LessonModel.find()
        .populate('createdBy', 'firstName lastName role email')
        .populate('groups', 'title')
        .populate('examen', 'id title description imageUrl slug _id')
        .lean();

    const result = lessons.map(lesson => {
        const cleaned = omitFields(lesson, ['__v', 'createdAt', 'updatedAt', 'materials']);
        const { _id, createdBy, examen, groups, ...rest } = cleaned;

        return {
            id: _id ? encodeId(_id.toString()) : null,
            examen: examen && omitFieldsDeep(examen, ['id', '_id']),
            groups: groups && omitFieldsDeep(groups, ['id', '_id']),
            createdBy: createdBy && omitFields(createdBy, ['id', '_id']),
            ...rest
        };
    });

    res.status(StatusCodes.OK).json(result);
});

export const getAllUsers = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const users = await UserModel.find()
        .select('-password -otpCode -otpExpiresAt -__v -updatedAt')
        .populate('groups', 'title')
        .lean();

    const mappedUsers = users.map(user => {
        const examAttempts = (user.examAttempts || []).map((attempt: any) => ({
            ...omitFields(attempt, ['_id']),
            id: encodeId(attempt._id.toString()),
            exam: attempt.exam ? encodeId(attempt.exam.toString()) : null,
            answers: (attempt.answers || []).map((ans: any) => ({
                ...omitFields(ans, ['_id']),
                id: encodeId(ans._id.toString())
            }))
        }));

        const { _id, ...restUser } = user;

        return {
            ...restUser,
            id: _id ? encodeId(_id.toString()) : null,
            groups: (user.groups || []).map((g: any) => {
                const { _id, ...rest } = g;
                return {
                    ...rest,
                    id: encodeId(_id.toString())
                };
            }),
            examAttempts
        };
    });

    res.status(StatusCodes.OK).json(mappedUsers);
});

export const getAllGroups = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    function safeArray(v: any): any[] {
        if (Array.isArray(v)) return v;
        if (v == null) return [];
        if (typeof v === 'object' && Object.keys(v).length === 0) return [];
        return [v];
    }

    const groups = await GroupModel.find()
        .populate('createdBy', 'login email firstName lastName')
        .populate('responsible', 'login email firstName lastName')
        .populate('exams', 'id title description imageUrl slug')
        .populate('users', 'firstName lastName email role')
        .populate('lessons', 'title imageUrl description slug')
        .lean();

    const result = groups.map(group => {
        const cleaned = omitFields(group, ['__v', 'createdAt', 'updatedAt']);
        const { _id, exams, users, lessons, createdBy, responsible, ...rest } = cleaned;

        return {
            id: _id ? encodeId(_id.toString()) : null,
            exams: safeArray(exams).map(e => omitFields(e, ['id', '_id'])),
            createdBy: createdBy ? omitFields(createdBy, ['id', '_id']) : null,
            users: safeArray(users).map(u => omitFields(u, ['id', '_id'])),
            lessons: safeArray(lessons).map(l => omitFields(l, ['id', '_id'])),
            responsible: safeArray(responsible).map(r => omitFields(r, ['id', '_id'])),
            ...rest
        };
    });

    res.status(StatusCodes.OK).json(result);
});
