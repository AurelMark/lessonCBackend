import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/asyncHandler';
import GroupModel from '@/models/GroupModel';
import { omitFields, omitFieldsDeep } from '@/utils/omitFields';
import { decodeIdSafe, encodeId } from '@/utils/idEncoder';
import { BadRequestError, NotFoundError } from '@/errors/customErrors';
import ExamModel from '@/models/ExamenModel';
import LessonModel from '@/models/LessonModel';
import UserModel from '@/models/UserModel';

export const createGroup = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const group = await GroupModel.create(req.body);

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Group created successfully',
        group,
    });
});

export const getAllGroups = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

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
            exams: exams && omitFieldsDeep(exams, ['id', '_id']),
            createdBy: createdBy && omitFields(createdBy, ['id', '_id']),
            users: users && omitFields(users, ['id', '_id']),
            lessons: lessons && omitFields(lessons, ['id', '_id']),
            responsible: responsible && omitFieldsDeep(responsible, ['id', '_id']),
            ...rest
        };
    });

    const totalPages = Math.ceil(totalGroups / limit);

    res.status(StatusCodes.OK).json({
        success: true,
        totalGroups,
        totalPages,
        currentPage: page,
        dataPerPage: result.length,
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
        exams: exams && omitFieldsDeep(exams, ['id', '_id']),
        createdBy: createdBy && omitFields(createdBy, ['id', '_id']),
        users: users && omitFields(users, ['id', '_id']),
        lessons: lessons && omitFields(lessons, ['id', '_id']),
        responsible: responsible && omitFieldsDeep(responsible, ['id', '_id']),
        ...rest
    });
});

export const updateGroup = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;
    const decodedId = decodeIdSafe(hashId);

    if (!decodedId) throw new BadRequestError('Invalid or missing ID');

    const group = await GroupModel.findByIdAndUpdate(decodedId, req.body, {
        new: true,
        runValidators: true,
    });

    if (!group) throw new NotFoundError('Group not found');

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Group updated successfully',
        group,
    });
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