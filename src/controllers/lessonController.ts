import { Request, Response } from 'express';
import LessonModel from '@/models/LessonModel';
import { catchAsync } from '@/utils/asyncHandler';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import { decodeIdSafe, encodeId } from '@/utils/idEncoder';
import { BadRequestError, NotFoundError } from '@/errors/customErrors';
import { omitFields, omitFieldsDeep } from '@/utils/omitFields';
import GroupModel from '@/models/GroupModel';
import ExamModel from '@/models/ExamenModel';

export const createLesson = catchAsync(async (req: Request, res: Response): Promise<void> => {
    delete req.body.slug;
    const {
        groups = [],
        examen = [],
        title,
        createdBy,
        isActive = true,
        ...resBody
    } = req.body;

    const decodedGroups = Array.isArray(groups)
        ? groups.map(decodeIdSafe).filter(Boolean)
        : [];

    const decodedExamens = Array.isArray(examen)
        ? examen.map(decodeIdSafe).filter(Boolean)
        : [];


    let baseSlug = slugify(title.ro, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await LessonModel.findOne({ slug });
    let counter = 1;
    while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await LessonModel.findOne({ slug });
        counter++;
    }

    const decodedId = decodeIdSafe(createdBy);

    if (!decodedId) {
        throw new BadRequestError('Invalid or missing createdBy ID');
    }


    const lesson = await LessonModel.create({
        ...resBody,
        groups: decodedGroups,
        examen: decodedExamens,
        title,
        isActive,
        createdBy: decodedId,
        slug,
    });

    res.status(StatusCodes.CREATED).json(lesson);
});

export const getAllLessons = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [lessons, totalLessons] = await Promise.all([
        LessonModel.find()
            .populate('createdBy', 'firstName lastName role email')
            .populate('groups', 'title')
            .populate('examen', 'id title description imageUrl slug _id')
            .skip(skip)
            .limit(limit)
            .lean(),
        LessonModel.countDocuments()
    ]);

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

    const totalPages = Math.ceil(totalLessons / limit);

    res.status(StatusCodes.OK).json({
        success: true,
        totalLessons,
        totalPages,
        currentPage: page,
        lessonsPerPage: result.length,
        data: result
    });
});

export const getLesson = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const lesson = await LessonModel
        .findOne({ slug })
        .populate('createdBy', 'firstName lastName role email')
        .populate('groups', 'title')
        .populate('examen', 'id title description imageUrl slug');

    if (!lesson) {
        throw new NotFoundError(`Lesson with slug "${slug}" not found`);
    }

    const raw = lesson.toObject();
    const lessonId = raw._id?.toString();

    const {
        createdBy,
        groups,
        examen,
        materials,
        ...rest
    } = omitFields(raw, ['__v', 'createdAt', 'updatedAt', '_id']);

    const transformWithEncodedId = (obj: any) => {
        if (!obj || typeof obj !== 'object' || !obj._id) return obj;
        const { _id, ...others } = obj;
        return { ...others, id: encodeId(_id.toString()) };
    };

    res.status(StatusCodes.OK).json({
        id: lessonId ? encodeId(lessonId) : null,
        createdBy: createdBy ? transformWithEncodedId(createdBy) : null,
        groups: Array.isArray(groups)
            ? groups
                .filter(g => typeof g === 'object' && g !== null && 'title' in g && '_id' in g)
                .map(g => ({
                    title: g.title,
                    id: encodeId(g._id.toString())
                }))
            : [],
        examen: examen && omitFieldsDeep(examen, ['_id']),
        materials: materials && omitFieldsDeep(materials, ['_id']),
        ...rest
    });
});

export const deleteLesson = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;

    const deleted = await LessonModel.findByIdAndDelete(realId);

    if (!deleted) {
        throw new NotFoundError('Lesson not found');
    }

    await Promise.all([
        ExamModel.updateMany({ lessons: deleted._id }, { $pull: { lessons: deleted._id } }),
        GroupModel.updateMany({ lessons: deleted._id }, { $pull: { lessons: deleted._id } }),
    ]);

    res.status(StatusCodes.OK).json({ message: 'Lesson deleted successfully' });


});

export const updateLesson = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;
    const { title, createdBy, groups, examen, ...reqBody } = req.body;

    const decodedId = decodeIdSafe(createdBy);

    if (!decodedId) {
        throw new BadRequestError('Invalid or missing createdBy ID');
    }

    const decodedGroups = groups.map(decodeIdSafe);
    if (decodedGroups.includes(null)) {
        throw new BadRequestError('One or more group IDs are invalid');
    }

    const decodedExamens = examen.map(decodeIdSafe);
    if (decodedExamens.includes(null)) {
        throw new BadRequestError('One or more examen IDs are invalid');
    }

    const lesson = await LessonModel.findByIdAndUpdate(realId, {
        title,
        ...reqBody,
        createdBy: decodedId,
        groups: decodedGroups,
    }, { new: true });

    if (!lesson) {
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Lesson not found' });
        return;
    }

    await Promise.all([GroupModel.updateMany(
        { _id: { $in: decodedGroups } },
        { $addToSet: { groups: lesson._id } }
    ),
    ExamModel.updateMany(
        { _id: { $in: decodedExamens } },
        { $addToSet: { lessons: lesson._id } }
    )]);

    res.status(StatusCodes.OK).json(lesson);
});


export const getLessonsByUserGroups = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const groupIds: string[] = user.groups.map((group: any) => decodeIdSafe(group.id));

    if (!groupIds.length) {
        res.status(StatusCodes.OK).json({
            success: true,
            totalLessons: 0,
            totalPages: 0,
            currentPage: 1,
            lessonsPerPage: 0,
            data: []
        });
        return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [lessons, totalLessons] = await Promise.all([
        LessonModel.find({ groups: { $in: groupIds } })
            .populate('createdBy', 'firstName lastName role email')
            .populate('groups', 'title')
            .populate('examen', 'id title description imageUrl slug _id')
            .skip(skip)
            .limit(limit)
            .lean(),
        LessonModel.countDocuments({ groups: { $in: groupIds } })
    ]);

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

    const totalPages = Math.ceil(totalLessons / limit);

    res.status(StatusCodes.OK).json({
        success: true,
        totalLessons,
        totalPages,
        currentPage: page,
        lessonsPerPage: result.length,
        data: result
    });
});


export const getLessonByClient = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const lesson = await LessonModel
        .findOne({ slug })
        .populate('createdBy', 'firstName lastName role email')
        .populate('groups', 'title')
        .populate('examen', 'id title description imageUrl slug');

    if (!lesson) {
        throw new NotFoundError(`Lesson with slug "${slug}" not found`);
    }

    const raw = lesson.toObject();
    const lessonId = raw._id?.toString();

    const {
        createdBy,
        groups,
        examen,
        materials,
        ...rest
    } = omitFields(raw, ['__v', 'createdAt', 'updatedAt', '_id']);

    const transformWithEncodedId = (obj: any) => {
        if (!obj || typeof obj !== 'object' || !obj._id) return obj;
        const { _id, ...others } = obj;
        return { ...others, id: encodeId(_id.toString()) };
    };

    res.status(StatusCodes.OK).json({
        id: lessonId ? encodeId(lessonId) : null,
        createdBy: createdBy ? transformWithEncodedId(createdBy) : null,
        groups: Array.isArray(groups)
            ? groups
                .filter(g => typeof g === 'object' && g !== null && 'title' in g && '_id' in g)
                .map(g => ({
                    title: g.title,
                    id: encodeId(g._id.toString())
                }))
            : [],
        examen: examen && omitFieldsDeep(examen, ['_id']),
        materials: materials && omitFieldsDeep(materials, ['_id']),
        ...rest
    });
});
