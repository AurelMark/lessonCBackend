import { Request, Response } from 'express';
import NewsModel from '@/models/NewsModel';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@/utils/asyncHandler';
import { NotFoundError } from '@/errors/customErrors';
import { escapeRegex } from '@/utils/escapeRegex';
import { omitFields } from '@/utils/omitFields';



export const getBlogNews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const news = await NewsModel.findOne({ slug });
    if (!news) {
        throw new NotFoundError(`News with slug "${slug}" not found`);
    }

    const safeNews = omitFields(news.toJSON(), ['_id', 'id']);

    res.status(StatusCodes.OK).json(safeNews);
});

export const getAllBlogNews = catchAsync(async (req: Request, res: Response): Promise<void> => {
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

    const sanitizedNews = news.map(item =>
        omitFields(item.toJSON(), ['id', '__v', 'createdAt', 'updatedAt'])
    );

    const currentNewsCount = news.length;

    res.status(StatusCodes.OK).json({
        data: sanitizedNews,
        totalNews,
        totalPages,
        currentPage: page,
        newsPerPage: currentNewsCount
    });
});
