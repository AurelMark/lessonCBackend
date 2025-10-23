import AboutUsModel from '@/models/AboutUsModel';
import { catchAsync } from '@/utils/asyncHandler';
import { omitFields } from '@/utils/omitFields';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const UpdateAboutUs = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;

    await AboutUsModel.findOneAndUpdate(
        {},
        data,
        { new: true, upsert: true }
    );

    res.status(StatusCodes.OK).json({
        message: 'About Us updated successfully',
    });
});

export const getAboutUs = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const aboutUs = await AboutUsModel.findOne();

    if (!aboutUs) {
        res.status(StatusCodes.OK).json({
            title: {
                ro: '',
                ru: '',
                en: ''
            },
            context: {
                ro: '',
                ru: '',
                en: ''
            }
        });
        return;
    }

    const cleaned = omitFields(aboutUs.toObject(), ['__v', 'createdAt', 'updatedAt', '_id']);
    res.status(StatusCodes.OK).json(cleaned);
});