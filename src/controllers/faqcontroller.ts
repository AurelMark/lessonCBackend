import FAQModel from '@/models/FAQModel';
import { catchAsync } from '@/utils/asyncHandler';
import { omitFields } from '@/utils/omitFields';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const UpdateFAQ = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const items = req.body;

    await FAQModel.findOneAndUpdate(
        {},
        { $set: { items } },
        { new: true, upsert: true }
    );

    res.status(StatusCodes.OK).json({
        message: 'FAQ updated successfully',
    });
});

export const getFAQ = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const FAQ = await FAQModel.findOne();

    if (!FAQ) {
        res.status(StatusCodes.OK).json([]);
        return;
    }

    const cleaned = omitFields(FAQ.toObject(), ['__v', 'createdAt', 'updatedAt']);
    res.status(StatusCodes.OK).json(cleaned.items);
});