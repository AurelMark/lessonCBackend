import { Request, Response } from 'express';
import NewsModel from '@/models/NewsModel';
import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import { catchAsync } from '@/utils/asyncHandler';
import { NotFoundError } from '@/errors/customErrors';
import { escapeRegex } from '@/utils/escapeRegex';
import { omitFields } from '@/utils/omitFields';

export const createNews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    delete req.body.slug;
    const { title, ...reqBody } = req.body;
    let baseSlug = slugify(title.ro, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await NewsModel.findOne({ slug });
    let counter = 1;
    while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await NewsModel.findOne({ slug });
        counter++;
    }

    const news = await NewsModel.create({
        title,
        ...reqBody,
        slug,
    });

    res.status(StatusCodes.CREATED).json(news);
});

export const getNews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const news = await NewsModel.findOne({ slug });
    if (!news) {
        throw new NotFoundError(`News with slug "${slug}" not found`);
    }

    res.status(StatusCodes.OK).json(news);
});

export const deleteNews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;

    const deleted = await NewsModel.findByIdAndDelete(realId);

    if (!deleted) {
        throw new NotFoundError('News not found');
    }

    res.status(StatusCodes.OK).json({ message: 'News deleted successfully' });
});

export const updateNews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { realId } = req;
    delete req.body.slug;
    const { title, ...reqBody } = req.body;
    let baseSlug = slugify(title.ro, { lower: true, strict: true });
    let slug = baseSlug;
    let exists = await NewsModel.findOne({ slug });
    let counter = 1;
    while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await NewsModel.findOne({ slug });
        counter++;
    };

    const news = await NewsModel.findByIdAndUpdate(realId, {
        title,
        ...reqBody,
        slug,
    }, { new: true });

    if (!news) {
        res.status(StatusCodes.NOT_FOUND).json({ message: 'News not found' });
    }

    res.status(StatusCodes.OK).json(news);
});

export const getAllNews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const titleSearch = req.query.title as string || '';
    const tagsSearch = req.query.tags as string || '';

    const skip = (page - 1) * limit;
    const searchFilter: any = {};

    if (titleSearch) {
        searchFilter.title = { $regex: escapeRegex(titleSearch), $options: 'i' };
    }

    if (tagsSearch) {
        searchFilter.tags = { $in: [escapeRegex(tagsSearch)] };
    }

    const totalNews = await NewsModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalNews / limit);
    const news = await NewsModel.find(searchFilter)
        .skip(skip)
        .limit(limit);
    const currentNewsCount = news.length;

    const sanitizedNews = news.map(item =>
        omitFields(item.toJSON(), ['__v', 'createdAt', 'updatedAt'])
    );

    res.status(StatusCodes.OK).json({
        data: sanitizedNews,
        totalNews,
        totalPages,
        currentPage: page,
        newsPerPage: currentNewsCount
    });
});