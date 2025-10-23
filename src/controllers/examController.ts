import { Request, Response } from 'express';
import { catchAsync } from '@/utils/asyncHandler';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import { decodeIdSafe, encodeId } from '@/utils/idEncoder';
import ExamModel from '@/models/ExamenModel';
import { BadRequestError, NotFoundError } from '@/errors/customErrors';
import { omitFields, omitFieldsDeep } from '@/utils/omitFields';
import LessonModel from '@/models/LessonModel';
import GroupModel from '@/models/GroupModel';
import UserModel from '@/models/UserModel';

export const createExam = catchAsync(async (req: Request, res: Response): Promise<void> => {
    delete req.body.slug;

    const {
        title,
        createdBy,
        responsible,
        lessons = [],
        groups = [],
        questions,
        imageUrl,
        description,
        content,
        deadline,
        isActive = true,
        timer
    } = req.body;

    const decodedCreatedBy = decodeIdSafe(createdBy);
    if (!decodedCreatedBy) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid createdBy ID'
        });
    }

    function decodeIds(arr: any[]) {
        return arr.map(decodeIdSafe);
    }

    const decodedResponsible = decodeIds(responsible).filter(Boolean);
    const decodedLessons = decodeIds(lessons).filter(Boolean);
    const decodedGroups = decodeIds(groups).filter(Boolean);

    if (decodedResponsible.length !== responsible.length) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more responsible IDs are invalid'
        });
        return;
    }
    if (decodedLessons.length !== lessons.length) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more lesson IDs are invalid'
        });
        return;
    }
    if (decodedGroups.length !== groups.length) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more group IDs are invalid'
        });
        return;
    }



    const baseSlug = slugify(title.ro, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await ExamModel.findOne({ slug });
    let counter = 1;
    while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await ExamModel.findOne({ slug });
        counter++;
    }

    const exam = await ExamModel.create({
        title,
        description,
        content,
        imageUrl,
        slug,
        createdBy: decodedCreatedBy,
        responsible: decodedResponsible,
        lessons: decodedLessons,
        groups: decodedGroups,
        questions,
        deadline,
        isActive,
        timer
    });

    res.status(StatusCodes.CREATED).json(exam);
});

export const getExam = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    const exam = await ExamModel.findOne({ slug })
        .populate('groups', 'title')
        .populate('lessons', 'title imageUrl description slug')
        .populate('responsible', 'firstName lastName role email')
        .populate('createdBy', 'firstName lastName role email')
        .populate('attempts.user');

    if (!exam) {
        throw new NotFoundError(`Exam with slug "${slug}" not found`);
    }

    const raw = exam.toObject();
    const examId = raw._id?.toString();

    const {
        createdBy,
        responsible = [],
        groups = [],
        lessons = [],
        questions,
        attempts = [],
        ...rest
    } = omitFields(raw, ['__v', 'createdAt', 'updatedAt', '_id']);

    const transformWithEncodedId = (obj: any) => {
        if (!obj || typeof obj !== 'object' || !obj._id) return obj;
        const { _id, ...others } = obj;
        return { ...others, id: encodeId(_id.toString()) };
    };

    const transformArray = (arr: any[]) =>
        arr.map(transformWithEncodedId);

    const cleanAnswers = (answers: any[]) =>
        answers.map((ans) => {
            const { _id, ...rest } = ans;
            return {
                ...rest,
                id: _id ? encodeId(_id.toString()) : null,
            };
        });

    const cleanAttempts = (attempts: any[]) =>
        attempts.map((attempt) => {
            const { _id, user, answers = [], ...rest } = attempt;
            return {
                ...rest,
                id: _id ? encodeId(_id.toString()) : null,
                user: user ? encodeId(user.toString()) : null,
                answers: cleanAnswers(answers),
            };
        });

    res.status(StatusCodes.OK).json({
        id: examId ? encodeId(examId) : null,
        createdBy: createdBy ? transformWithEncodedId(createdBy) : null,
        responsible: transformArray(responsible),
        groups: transformArray(groups),
        lessons: transformArray(lessons),
        questions: questions ? omitFieldsDeep(questions, ['_id']) : [],
        attempts: cleanAttempts(attempts),
        ...rest
    });
});

export const getAllExams = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [exams, totalExams] = await Promise.all([
        ExamModel.find()
            .populate('groups', 'title')
            .populate('lessons', 'title imageUrl description slug')
            .populate('responsible', 'firstName lastName role email')
            .populate('createdBy', 'firstName lastName role email')
            .populate('attempts')
            .skip(skip)
            .limit(limit),
        ExamModel.countDocuments()
    ]);

    const cleanObject = (obj: any) => {
        if (!obj || typeof obj !== 'object' || !obj._id) return obj;
        const { _id, ...rest } = obj;
        return {
            ...rest,
            id: encodeId(_id.toString())
        };
    };

    const cleanArray = (arr: any[]) =>
        arr.map((item) => cleanObject(item)).filter(Boolean);

    const cleanAnswers = (answers: any[]) =>
        answers.map((ans) => {
            const { _id, ...rest } = ans;
            return {
                ...rest,
                id: _id ? encodeId(_id.toString()) : null,
            };
        });

    const cleanAttempts = (attempts: any[]) =>
        attempts.map((attempt) => {
            const { _id, user, answers = [], ...rest } = attempt;
            return {
                ...rest,
                id: _id ? encodeId(_id.toString()) : null,
                user: user ? encodeId(user.toString()) : null,
                answers: cleanAnswers(answers),
            };
        });


    const result = exams.map((examDoc) => {
        const exam = examDoc.toObject();
        const {
            _id,
            createdBy,
            responsible = [],
            lessons = [],
            groups = [],
            attempts = [],
            ...rest
        } = omitFields(exam, ['__v', 'createdAt', 'updatedAt', 'questions']);

        return {
            id: _id ? encodeId(_id.toString()) : null,
            createdBy: cleanObject(createdBy),
            responsible: cleanArray(responsible),
            lessons: cleanArray(lessons),
            groups: cleanArray(groups),
            attempts: cleanAttempts(attempts),
            ...rest
        };
    });

    const totalPages = Math.ceil(totalExams / limit);

    res.status(StatusCodes.OK).json({
        totalExams,
        totalPages,
        currentPage: page,
        examPerPage: result.length,
        data: result
    });
});

export const deleteExam = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;

    const deleted = await ExamModel.findByIdAndDelete(realId);

    if (!deleted) {
        throw new NotFoundError('Exam not found');
    }

    await Promise.all([
        LessonModel.updateMany({ examen: deleted._id }, { $pull: { examen: deleted._id } }),
        GroupModel.updateMany({ exams: deleted._id }, { $pull: { exams: deleted._id } }),
    ]);


    res.status(StatusCodes.OK).json({ message: 'Exam deleted successfully' });
});


export const updateExam = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;

    const {
        title,
        createdBy,
        responsible = [],
        groups = [],
        lessons = [],
        ...reqBody
    } = req.body;

    const decodedCreatedBy = decodeIdSafe(createdBy);
    if (!decodedCreatedBy) {
        throw new BadRequestError('Invalid or missing createdBy ID');
    }

    const decodedResponsible = responsible.map(decodeIdSafe);
    if (decodedResponsible.includes(null)) {
        throw new BadRequestError('One or more responsible user IDs are invalid');
    }

    const decodedGroups = groups.map(decodeIdSafe);
    if (decodedGroups.includes(null)) {
        throw new BadRequestError('One or more group IDs are invalid');
    }

    const decodedLessons = lessons.map(decodeIdSafe);
    if (decodedLessons.includes(null)) {
        throw new BadRequestError('One or more lesson IDs are invalid');
    }

    const updatedExam = await ExamModel.findByIdAndUpdate(
        realId,
        {
            title,
            ...reqBody,
            createdBy: decodedCreatedBy,
            responsible: decodedResponsible,
            groups: decodedGroups,
            lessons: decodedLessons,
        },
        { new: true }
    );

    if (!updatedExam) {
        res.status(StatusCodes.NOT_FOUND).json({ message: 'Exam not found' });
        return;
    }

    await Promise.all([
        LessonModel.updateMany(
            { _id: { $in: decodedLessons } },
            { $addToSet: { examen: updatedExam._id } }
        ),
        GroupModel.updateMany(
            { _id: { $in: decodedGroups } },
            { $addToSet: { exams: updatedExam._id } }
        )
    ]);

    res.status(StatusCodes.OK).json(updatedExam);
});

export const submitExam = catchAsync(async (req: Request, res: Response) => {
    const { examId, userId, answers } = req.body;

    const decodedExamId = decodeIdSafe(examId);
    const decodedUserId = decodeIdSafe(userId);

    if (!decodedExamId || !decodedUserId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid exam or user ID' });
    }

    const exam = await ExamModel.findById(decodedExamId);
    const user = await UserModel.findById(decodedUserId);

    if (!exam || !user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Exam or user not found' });
    }

    let score = 0;
    const submittedAnswers = [];

    for (const answer of answers) {
        const { questionIndex, selectedOptionIndex } = answer;
        const question = exam.questions[questionIndex];

        if (!question || !question.options[selectedOptionIndex]) continue;

        const selected = question.options[selectedOptionIndex];
        const isCorrect = selected.isAnswer;

        if (isCorrect) score++;

        submittedAnswers.push({
            questionIndex,
            selectedOptionIndex,
            correct: isCorrect,
        });
    }

    const attemptRecord = {
        exam: decodedExamId,
        score,
        answers: submittedAnswers,
        submittedAt: new Date(),
    };

    await UserModel.findByIdAndUpdate(decodedUserId, {
        $push: { examAttempts: attemptRecord },
    });

    await ExamModel.updateOne(
        { _id: decodedExamId },
        {
            $push: {
                attempts: {
                    $each: [{
                        user: decodedUserId,
                        score,
                        submittedAt: new Date(),
                        answers: submittedAnswers
                    }]
                }
            }
        }
    );

    res.status(StatusCodes.OK).json({
        success: true,
        score,
    });
});

export const getExamsByUserGroups = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const groupIds: string[] = user.groups.map((group: any) => decodeIdSafe(group.id));

    if (!groupIds.length) {
        res.status(StatusCodes.OK).json({
            totalExams: 0,
            totalPages: 0,
            currentPage: 1,
            examPerPage: 0,
            data: []
        });
        return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [exams, totalExams] = await Promise.all([
        ExamModel.find({ groups: { $in: groupIds } })
            .populate('groups', 'title')
            .populate('lessons', 'title imageUrl description slug')
            .populate('responsible', 'firstName lastName role email')
            .populate('createdBy', 'firstName lastName role email')
            .populate('attempts')
            .skip(skip)
            .limit(limit)
            .lean(),
        ExamModel.countDocuments({ groups: { $in: groupIds } })
    ]);

    const cleanObject = (obj: any) => {
        if (!obj || typeof obj !== 'object' || !obj._id) return obj;
        const { _id, ...rest } = obj;
        return {
            ...rest,
            id: encodeId(_id.toString())
        };
    };

    const cleanArray = (arr: any[]) =>
        arr.map((item) => cleanObject(item)).filter(Boolean);

    const cleanAnswers = (answers: any[]) =>
        answers.map((ans) => {
            const { _id, ...rest } = ans;
            return {
                ...rest,
                id: _id ? encodeId(_id.toString()) : null,
            };
        });

    const cleanAttempts = (attempts: any[]) =>
        attempts.map((attempt) => {
            const { _id, user, answers = [], ...rest } = attempt;
            return {
                ...rest,
                id: _id ? encodeId(_id.toString()) : null,
                user: user ? encodeId(user.toString()) : null,
                answers: cleanAnswers(answers),
            };
        });

    const result = exams.map((exam) => {
        const {
            _id,
            createdBy,
            responsible = [],
            lessons = [],
            groups = [],
            attempts = [],
            ...rest
        } = omitFields(exam, ['__v', 'createdAt', 'updatedAt', 'questions']);

        return {
            id: _id ? encodeId(_id.toString()) : null,
            createdBy: cleanObject(createdBy),
            responsible: cleanArray(responsible),
            lessons: cleanArray(lessons),
            groups: cleanArray(groups),
            attempts: cleanAttempts(attempts),
            ...rest
        };
    });

    const totalPages = Math.ceil(totalExams / limit);

    res.status(StatusCodes.OK).json({
        totalExams,
        totalPages,
        currentPage: page,
        examPerPage: result.length,
        data: result
    });
});

export const getExamByGroups = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const user = (req as any).user;

    const userGroupIds: string[] = user?.groups?.map((group: any) => decodeIdSafe(group.id)) || [];


    let examQuery: any = { slug };

    if (user?.role !== 'admin') {
        examQuery.groups = { $in: userGroupIds };
    }

    const exam = await ExamModel.findOne(examQuery)
        .populate('groups', 'title')
        .populate('lessons', 'title imageUrl description slug')
        .populate('responsible', 'firstName lastName role email')
        .populate('createdBy', 'firstName lastName role email');

    if (!exam) {
        throw new NotFoundError(`Exam with slug "${slug}" not found or access denied`);
    }

    const raw = exam.toObject();
    const examId = raw._id?.toString();

    const {
        createdBy,
        responsible = [],
        groups = [],
        lessons = [],
        questions,
        ...rest
    } = omitFields(raw, ['__v', 'createdAt', 'updatedAt', '_id', 'attempts']);

    const transformWithEncodedId = (obj: any) => {
        if (!obj || typeof obj !== 'object' || !obj._id) return obj;
        const { _id, ...others } = obj;
        return { ...others, id: encodeId(_id.toString()) };
    };

    const transformArray = (arr: any[]) =>
        arr.map(transformWithEncodedId);

    res.status(StatusCodes.OK).json({
        id: examId ? encodeId(examId) : null,
        createdBy: createdBy ? transformWithEncodedId(createdBy) : null,
        responsible: transformArray(responsible),
        groups: transformArray(groups),
        lessons: transformArray(lessons),
        questions: questions ? omitFieldsDeep(questions, ['_id']) : [],
        ...rest
    });
});



export const getExamsWithAttempts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [exams, totalExams] = await Promise.all([
            ExamModel.find({ 'attempts.0': { $exists: true } })
                .select('attempts title')
                .populate({
                    path: 'attempts.user',
                    select: 'firstName lastName email role'
                })
                .skip(skip)
                .limit(limit),
            ExamModel.countDocuments({ 'attempts.0': { $exists: true } })
        ]);

        const cleanUser = (user: any) => {
            if (!user) return null;
            if (typeof user === 'object' && user._id) {
                const { _id, ...rest } = user;
                return { ...rest, id: encodeId(_id.toString()) };
            }
            return encodeId(user.toString());
        };

        const cleanAnswers = (answers: any[]) =>
            answers.map((ans) => {
                const { _id, ...rest } = ans;
                return {
                    ...rest,
                    id: _id ? encodeId(_id.toString()) : null,
                };
            });

        const cleanAttempts = (attempts: any[]) =>
            attempts.map((attempt) => {
                const { _id, user, answers = [], ...rest } = attempt;
                return {
                    ...rest,
                    id: _id ? encodeId(_id.toString()) : null,
                    user: cleanUser(user),
                    answers: cleanAnswers(answers),
                };
            });

        const data = exams.map((examDoc) => {
            const exam = examDoc.toObject();
            const cleanedAttempts = cleanAttempts(exam.attempts || []);
            if (!cleanedAttempts.length) return null;
            return {
                title: exam.title,
                attempt: cleanedAttempts[cleanedAttempts.length - 1]
            };
        }).filter(Boolean);

        res.status(StatusCodes.OK).json({
            totalExams,
            totalPages: Math.ceil(totalExams / limit),
            currentPage: page,
            examPerPage: data.length,
            data
        });

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Error retrieving exams attempts only',
            error: error instanceof Error ? error.message : error,
        });
    }
};



