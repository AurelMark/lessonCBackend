import NewsModel from '@/models/NewsModel';
import { catchAsync } from '@/utils/asyncHandler';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const getAllTags = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const uniqueTags = await NewsModel.distinct('tags');
    res.status(StatusCodes.OK).json(uniqueTags);
});