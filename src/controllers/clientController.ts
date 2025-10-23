import UserModel from '@/models/UserModel';
import { catchAsync } from '@/utils/asyncHandler';
import { encodeId } from '@/utils/idEncoder';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendMail } from '@/utils/mailer';
import bcrypt from 'bcryptjs';

export const getProfileData = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.query;

    const user = await UserModel.findOne({
        ...(email ? { email: email.toString() } : {})
    }).populate('groups').select('-password -otpCode -otpExpiresAt');

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found',
        });
        return;
    }

    const raw = user.toObject();

    const encodeIdField = (doc: any) => {
        if (!doc || typeof doc !== 'object' || !doc._id) return doc;
        const { _id, ...rest } = doc;
        return { ...rest, id: encodeId(_id.toString()) };
    };

    const transformAnswers = (answers: any[]) =>
        answers.map(({ _id, ...rest }) => ({
            ...rest,
            id: _id ? encodeId(_id.toString()) : null,
        }));

    const transformAttempts = (attempts: any[]) =>
        attempts.map(({ _id, exam, answers = [], ...rest }) => ({
            ...rest,
            id: _id ? encodeId(_id.toString()) : null,
            exam: exam ? encodeId(exam.toString()) : null,
            answers: transformAnswers(answers),
        }));

    const { _id, groups = [], examAttempts = [], ...rest } = raw;

    res.status(StatusCodes.OK).json({
        ...rest,
        id: encodeId(_id.toString()),
        groups: groups.map(encodeIdField),
        examAttempts: transformAttempts(examAttempts),
    });
});

export const resetPasswordClient = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, login, newPassword } = req.body;

    const user = await UserModel.findOne({ email, login });

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found.',
        });
        return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    await sendMail(
        email,
        'Your Password Was Successfully Updated',
        `
          <h2>Hello, <b>${user.firstName} ${user.lastName}</b>! 🔐</h2>
          <p style="font-size:18px;">
            Your password has been <b>successfully updated</b> for your <b>Phonetics Learning Center</b> account.
          </p>
          <p style="font-size:18px;">
            You can now log in with your new credentials and continue learning with confidence.
          </p>
          <br/>
          <p style="font-size:14px; color:#888;">If you didn’t request this password reset, please contact support immediately.</p>
        `
    );

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Password has been reset successfully.',
    });
    return;
});