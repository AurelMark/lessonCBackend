import HomepageModel from '@/models/HomepageModel';
import { catchAsync } from '@/utils/asyncHandler';
import { omitFields } from '@/utils/omitFields';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const UpdateHomepage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;

    await HomepageModel.findOneAndUpdate(
        {},
        data,
        { new: true, upsert: true }
    );
    
    res.status(StatusCodes.OK).json({
        message: 'Homepage updated successfully',
    });
});

export const getHomepage = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const homepage = await HomepageModel.findOne();

    if (!homepage) {
        res.status(StatusCodes.OK).json({
            slider: [],
            info: [],
            education: []
        });
        return;
    }

    const cleaned = omitFields(homepage.toObject(), ['__v', 'createdAt', 'updatedAt', '_id']);
    res.status(StatusCodes.OK).json(cleaned);
});