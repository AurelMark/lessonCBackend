import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/asyncHandler';
import GroupModel from '@/models/GroupModel';
import { omitFields } from '@/utils/omitFields';
import { decodeIdSafe, encodeId } from '@/utils/idEncoder';
import { BadRequestError, NotFoundError } from '@/errors/customErrors';
import ExamModel from '@/models/ExamenModel';
import LessonModel from '@/models/LessonModel';
import UserModel from '@/models/UserModel';

export const createGroup = catchAsync(async (req: Request, res: Response): Promise<void> => {
    let {
        users = [],
        responsible = [],
        lessons = [],
        exams = [],
        createdBy,
        ...rest
    } = req.body;

    let decodedCreatedBy: string | undefined;
    if (createdBy) {
        decodedCreatedBy = decodeIdSafe(createdBy);
        if (!decodedCreatedBy) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid createdBy ID'
            });
        }
    }

    function decodeIds(arr: any[]) {
        return arr.map(decodeIdSafe);
    }

    if (!Array.isArray(users)) users = [];
    if (!Array.isArray(responsible)) responsible = [];
    if (!Array.isArray(lessons)) lessons = [];
    if (!Array.isArray(exams)) exams = [];

    const decodedUsers = decodeIds(users);
    const decodedResponsible = decodeIds(responsible);
    const decodedLessons = decodeIds(lessons);
    const decodedExams = decodeIds(exams);

    if (decodedUsers.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more user IDs are invalid'
        });
        return;
    }
    if (decodedResponsible.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more responsible IDs are invalid'
        });
        return;
    }
    if (decodedLessons.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more lesson IDs are invalid'
        });
        return;
    }
    if (decodedExams.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more exam IDs are invalid'
        });
        return;
    }

    const group = await GroupModel.create({
        ...rest,
        users: decodedUsers,
        responsible: decodedResponsible,
        lessons: decodedLessons,
        exams: decodedExams,
        createdBy: decodedCreatedBy
    });

    res.status(StatusCodes.CREATED).json(group);
});

export const getAllGroups = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    function safeArray(v: any): any[] {
        if (Array.isArray(v)) return v;
        if (v == null) return [];
        if (typeof v === 'object' && Object.keys(v).length === 0) return [];
        return [v];
    }

    const [groups, totalGroups] = await Promise.all([
        GroupModel.find()
            .populate('createdBy', 'login email firstName lastName')
            .populate('responsible', 'login email firstName lastName')
            .populate('exams', 'id title description imageUrl slug')
            .populate('users', 'firstName lastName email role')
            .populate('lessons', 'title imageUrl description slug')
            .skip(skip)
            .limit(limit)
            .lean(),
        GroupModel.countDocuments()
    ]);

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

    const totalPages = Math.ceil(totalGroups / limit);

    res.status(StatusCodes.OK).json({
        totalGroups,
        totalPages,
        currentPage: page,
        totalPerPage: result.length,
        data: result
    });
});

export const getGroupById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;
    const decodedId = decodeIdSafe(hashId);

    if (!decodedId) {
        throw new BadRequestError('Invalid or missing ID');
    }

    const group = await GroupModel.findById(decodedId)
        .populate('createdBy', 'login email firstName lastName')
        .populate('responsible', 'login email firstName lastName')
        .populate('exams', 'id title description imageUrl slug')
        .populate('users', 'firstName lastName email role')
        .populate('lessons', 'title imageUrl description slug');

    if (!group) {
        throw new NotFoundError('Group not found');
    }

    const raw = group.toObject();
    const lessonId = raw._id?.toString();

    const {
        exams, users, lessons, createdBy, responsible, ...rest
    } = omitFields(raw, ['__v', 'createdAt', 'updatedAt', '_id']);

    res.status(StatusCodes.OK).json({
        id: lessonId ? encodeId(lessonId.toString()) : null,
        exams: Array.isArray(exams)
            ? exams.map(e => ({
                ...omitFields(e, ['_id', 'id']),
                id: e._id ? encodeId(e._id.toString()) : null,
            }))
            : [],
        createdBy: createdBy
            ? { ...omitFields(createdBy, ['_id', 'id']), id: createdBy._id ? encodeId(createdBy._id.toString()) : null }
            : null,
        users: Array.isArray(users)
            ? users.map(u => ({
                ...omitFields(u, ['_id', 'id']),
                id: u._id ? encodeId(u._id.toString()) : null,
            }))
            : [],
        lessons: Array.isArray(lessons)
            ? lessons.map(l => ({
                ...omitFields(l, ['_id', 'id']),
                id: l._id ? encodeId(l._id.toString()) : null,
            }))
            : [],
        responsible: Array.isArray(responsible)
            ? responsible.map(r => ({
                ...omitFields(r, ['_id', 'id']),
                id: r._id ? encodeId(r._id.toString()) : null,
            }))
            : [],
        ...rest,
    });
});

export const updateGroup = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;
    const decodedId = decodeIdSafe(hashId);

    if (!decodedId) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid or missing group ID'
        });
        return;
    }

    let {
        users = [],
        responsible = [],
        lessons = [],
        exams = [],
        createdBy,
        ...rest
    } = req.body;

    let decodedCreatedBy: string | undefined;
    if (createdBy) {
        decodedCreatedBy = decodeIdSafe(createdBy);
        if (!decodedCreatedBy) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid createdBy ID'
            });
            return;
        }
    }

    function decodeIds(arr: any[]) {
        return arr.map(decodeIdSafe);
    }

    if (!Array.isArray(users)) users = [];
    if (!Array.isArray(responsible)) responsible = [];
    if (!Array.isArray(lessons)) lessons = [];
    if (!Array.isArray(exams)) exams = [];

    const decodedUsers = decodeIds(users);
    const decodedResponsible = decodeIds(responsible);
    const decodedLessons = decodeIds(lessons);
    const decodedExams = decodeIds(exams);

    if (decodedUsers.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more user IDs are invalid'
        });
        return;
    }
    if (decodedResponsible.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more responsible IDs are invalid'
        });
        return;
    }
    if (decodedLessons.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more lesson IDs are invalid'
        });
        return;
    }
    if (decodedExams.some(id => !id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more exam IDs are invalid'
        });
        return;
    }

    const updateData = {
        ...rest,
        users: decodedUsers,
        responsible: decodedResponsible,
        lessons: decodedLessons,
        exams: decodedExams,
    };

    if (decodedCreatedBy) updateData['createdBy'] = decodedCreatedBy;

    const group = await GroupModel.findByIdAndUpdate(decodedId, updateData, {
        new: true,
        runValidators: true,
    });

    if (!group) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'Group not found',
        });
        return;
    }

    res.status(StatusCodes.OK).json(group);
});


export const deleteGroup = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;
    const decodedId = decodeIdSafe(hashId);

    if (!decodedId) throw new BadRequestError('Invalid or missing ID');

    const deleted = await GroupModel.findByIdAndDelete(decodedId);

    if (!deleted) throw new NotFoundError('Group not found');

    await Promise.all([
        ExamModel.updateMany({ groups: deleted._id }, { $pull: { groups: deleted._id } }),
        LessonModel.updateMany({ groups: deleted._id }, { $pull: { groups: deleted._id } }),
        UserModel.updateMany({ groups: deleted._id }, { $pull: { groups: deleted._id } })
    ]);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Group deleted successfully',
    });
});