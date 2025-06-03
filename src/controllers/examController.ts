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

    const decodedResponsible = responsible
        .map(decodeIdSafe)
        .filter(Boolean);

    if (decodedResponsible.length !== responsible.length) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'One or more responsible IDs are invalid'
        });
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
        lessons,
        groups,
        questions,
        deadline,
        isActive,
        timer
    });

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Exam created successfully',
        exam
    });
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
        success: true,
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
    delete req.body.slug;

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

    let baseSlug = slugify(title.ro, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await ExamModel.findOne({ slug });
    let counter = 1;
    while (exists && exists._id.toString() !== realId) {
        slug = `${baseSlug}-${counter}`;
        exists = await ExamModel.findOne({ slug });
        counter++;
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
            slug,
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

    res.status(StatusCodes.OK).json({ news: updatedExam });
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
        total: exam.questions.length,
        details: submittedAnswers,
    });
});