import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import { catchAsync } from '@/utils/asyncHandler';
import CourseModel from '@/models/CourseModel';
import { BadRequestError, NotFoundError } from '@/errors/customErrors';
import SubCourseModel from '@/models/SubCourseModel';
import { omitFields } from '@/utils/omitFields';
import { decodeIdSafe, encodeId } from '@/utils/idEncoder';

export const createCourse = catchAsync(async (req: Request, res: Response): Promise<void> => {
    delete req.body.slug;
    const { title, ...reqBody } = req.body;
    let baseSlug = slugify(title.ro, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await CourseModel.findOne({ slug });
    let counter = 1;
    while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await CourseModel.findOne({ slug });
        counter++;
    }

    const course = await CourseModel.create({
        title,
        ...reqBody,
        slug,
    });

    res.status(StatusCodes.CREATED).json({ course });
});

export const getCourse = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    const course = await CourseModel.findOne({ slug }).lean();
    if (!course) {
        throw new NotFoundError(`Course with slug "${slug}" not found`);
    }

    const subCourses = await SubCourseModel.find({ courseSlug: slug }).lean();

    const cleanCourse = omitFields(course, ['_id', '__v', 'createdAt', 'updatedAt']);
    const cleanSubcourses = subCourses.map((subDoc) =>
        omitFields(subDoc, ['_id', '__v', 'createdAt', 'updatedAt'])
    );

    res.status(StatusCodes.OK).json({
        course: cleanCourse,
        subcourses: cleanSubcourses,
    });
});

export const updateCourse = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;
    delete req.body.slug;
    const { title, ...reqBody } = req.body;
    let baseSlug = slugify(title.ro, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await CourseModel.findOne({ slug });
    let counter = 1;
    while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await CourseModel.findOne({ slug });
        counter++;
    };

    const course = await CourseModel.findByIdAndUpdate(realId, {
        title,
        ...reqBody,
        slug,
    }, { new: true });

    if (!course) {
        res.status(StatusCodes.NOT_FOUND).json({ message: 'News not found' });
    }

    res.status(StatusCodes.OK).json({ course });
});

export const deleteCourse = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;

    const course = await CourseModel.findById(realId);

    if (!course) {
        throw new NotFoundError('Course not found');
    }

    await SubCourseModel.updateMany(
        { courseSlug: course.slug },
        { $unset: { courseSlug: '' } }
    );

    await course.deleteOne();

    res.status(StatusCodes.OK).json({ message: 'Course deleted successfully and subcourses were unlinked' });
});

export const getAllCourses = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const skip = (page - 1) * limit;
    const searchFilter: any = {};

    const total = await CourseModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(total / limit);
    const news = await CourseModel.find(searchFilter)
        .skip(skip)
        .limit(limit);

    const currentCourseCount = news.length;

    res.status(StatusCodes.OK).json({
        data: news,
        total,
        totalPages,
        currentPage: page,
        coursePerPage: currentCourseCount
    });
});

export const createSubCourse = catchAsync(async (req: Request, res: Response) => {
    const { courseSlug } = req.params;

    if (courseSlug) {
        req.body.courseSlug = courseSlug;
    }

    if (!req.body.courseSlug) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'courseSlug is required',
        });
    }

    const course = await CourseModel.findOne({ slug: req.body.courseSlug });

    if (!course) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Parent course not found' });
    }

    const subCourse = await SubCourseModel.create({
        ...req.body,
        courseSlug: req.body.courseSlug,
    });

    res.status(StatusCodes.CREATED).json(subCourse);
});

export const getAllSubCourses = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const [subCourses, totalSubCourses] = await Promise.all([
        SubCourseModel.find()
            .skip(skip)
            .limit(limit)
            .lean(),
        SubCourseModel.countDocuments(),
    ]);

    const cleanSubCourses = subCourses.map((subDoc) => {
        const { _id, ...rest } = omitFields(subDoc, ['__v', 'createdAt', 'updatedAt']);
        return {
            ...rest,
            id: _id ? encodeId(_id.toString()) : undefined,
        };
    }
    );

    const totalPages = Math.ceil(totalSubCourses / limit);

    res.status(StatusCodes.OK).json({
        subcourses: cleanSubCourses,
        totalSubCourses,
        totalPages,
        currentPage: page,
        subCoursesPerPage: cleanSubCourses.length,
    });
});

export const updateSubCourse = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { courseSlug } = req.params;
    const { id } = req.body;

    if (!id) {
        throw new NotFoundError('SubCourse id must be provided for update.');
    }

    const realId = decodeIdSafe(id);

    if (!realId) {
        throw new BadRequestError('Invalid SubCourse id provided.');
    }

    const subCourse = await SubCourseModel.findOneAndUpdate(
        { _id: realId, courseSlug },
        req.body,
        { new: true, runValidators: true }
    );

    if (!subCourse) {
        throw new NotFoundError('SubCourse not found.');
    }

    res.status(StatusCodes.OK).json({ subcourse: subCourse });
});

export const deleteSubCourse = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { courseSlug } = req.params;
    const { id } = req.body;

    if (!id) {
        throw new NotFoundError('SubCourse id must be provided for deletion.');
    }

    const realId = decodeIdSafe(id);

    if (!realId) {
        throw new BadRequestError('Invalid SubCourse id provided.');
    }

    const subCourse = await SubCourseModel.findOneAndDelete({ _id: realId, courseSlug });

    if (!subCourse) {
        throw new NotFoundError('SubCourse not found.');
    }

    res.status(StatusCodes.OK).json({ message: 'SubCourse deleted successfully.' });
});


export const getSubCourse = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;

    const subCourse = await SubCourseModel.findById(realId);

    if (!subCourse) {
        throw new NotFoundError('SubCourse not found');
    }

    const safeSubCourse = omitFields(subCourse.toJSON(), ['__v', 'createdAt', 'updatedAt']);

    res.status(StatusCodes.OK).json(safeSubCourse);
});

