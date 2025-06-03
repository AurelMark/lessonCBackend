import { omitFields } from '@/utils/omitFields';
import UserModel from '@/models/UserModel';
import { catchAsync } from '@/utils/asyncHandler';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendMail } from '@/utils/mailer';
import { generateOtp } from '@/utils/generateOtp';
import dayjs from 'dayjs';
import config from '@/config/config';
import { generateUserPDFBuffer } from '@/utils/generateUserPDF';
import { decodeIdSafe, encodeId } from '@/utils/idEncoder';
import { BadRequestError, NotFoundError } from '@/errors/customErrors';
import { Types } from 'mongoose';
import { escapeRegex } from '@/utils/escapeRegex';

function generateSuffix(length = 4): string {
    return randomBytes(length).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, length);
}

export const createUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const {
        login,
        email,
        password,
        firstName,
        lastName,
        role,
        groups = []
    } = req.body;

    const existingUser = await UserModel.findOne({ $or: [{ login }, { email }] });
    if (existingUser) {
        res.status(StatusCodes.CONFLICT).json({
            message: 'Login or email already in use',
        });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otpCode = generateOtp();
    const otpExpiresAt = dayjs().add(3, 'hour').toDate();

    const user = await UserModel.create({
        login,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        groups,
        otpCode,
        otpExpiresAt,
        isTempAccount: false,
        isVerified: false,
        isActive: true,
        isOtpLogin: false,
    });

    await sendMail(
        email,
        'Welcome to Phonetics Learning Center! Confirm Your Account',
        `<h2>Welcome, <b>${firstName} ${lastName}</b>!</h2>
         <p style="font-size:18px">Your login: <code>${login}</code></p>
         <p style="font-size:18px">Your email: <code>${email}</code></p>
         <p style="font-size:18px"><b>Verification code:</b> <code>${otpCode}</code> (valid for 3 hours)</p>
         <p style="font-size:18px">Please use this code to verify your account and complete your registration.</p>`
    );



    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'User created successfully',
        user: {
            login: user.login,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        }
    });
    return;
});

export const verifyOtpCode = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { login, email, otpCode } = req.body;

    const user = await UserModel.findOne({ login, email });

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found with the provided login and email.',
        });
        return;
    }

    if (user.isVerified) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'User is already verified.',
        });
        return;
    }

    if (!user.otpCode || !user.otpExpiresAt || user.otpCode !== otpCode) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid or expired OTP code.',
        });
        return;
    }

    const now = new Date();
    if (user.otpExpiresAt < now) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'OTP code has expired.',
        });
        return;
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.isTempAccount = false;

    await user.save();

    await sendMail(
        email,
        'Your Phonetics Learning Account is Verified!',
        `
          <h2>Welcome, <b>${user.firstName} ${user.lastName}</b>! 🎉</h2>
          <p style="font-size:18px;">
            Your account has been <b>successfully verified</b> and activated. You can now log in and start exploring all the features of the <b>Phonetics Learning Center</b>.
          </p>
          <p style="font-size:18px;">We’re excited to have you on board! 💬📘</p>
          <br/>
          <p style="font-size:14px; color:#888;">If you did not request this registration, please ignore this message.</p>
        `
    );


    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Account successfully verified.',
    });
    return;
});


export const resendOtpCode = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, login } = req.body;

    const user = await UserModel.findOne({ email, login });

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found with the provided email and login.',
        });
        return;
    }

    if (user.isVerified) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Account is already verified.',
        });
        return;
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    user.otpCode = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendMail(
        user.email,
        'Your OTP Code (Phonetics)',
        `<h2>Hello <b>${user.firstName} ${user.lastName}</b>,</h2>
       <p style="font-size:18px">Your new OTP code is: <code>${otp}</code></p>
       <p style="font-size:18px">This code will expire in 3 hours.</p>`
    );

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'New OTP code sent to your email.',
    });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, login } = req.body;

    const user = await UserModel.findOne({ email, login });

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found with provided login and email',
        });
        return;
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + 3 * 60 * 60 * 1000);

    user.otpCode = otp;
    user.otpExpiresAt = expires;
    await user.save();

    await sendMail(
        user.email,
        'Password Reset OTP Code',
        `<h2>Hello ${user.firstName},</h2>
       <p style="font-size:18px">Your password reset OTP code is: <b>${otp}</b></p>
       <p style="font-size:18px">This code expires in 3 hours.</p>`
    );

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'OTP code sent to your email.',
    });
    return;
});

export const resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, login, otpCode, newPassword } = req.body;

    const user = await UserModel.findOne({ email, login });

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found.',
        });
        return;
    }

    if (!user.otpCode || !user.otpExpiresAt || user.otpCode !== otpCode) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid or expired OTP code.',
        });
        return;
    }

    if (user.otpExpiresAt < new Date()) {
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'OTP code has expired.',
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

export const generateUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { count, baseLogin, baseEmail, groups = [] } = req.body;

    const tempUsers = [];
    const plainPasswords = [];
    const usedLogins = new Set();
    const usedEmails = new Set();

    for (let i = 0; i < count; i++) {
        let login, email;

        do {
            const suffix = generateSuffix();
            login = `${baseLogin}-${suffix}`;
        } while (usedLogins.has(login) || await UserModel.exists({ login }));

        do {
            const suffix = generateSuffix();
            email = `${baseEmail}-${suffix}@phonetics.md`;
        } while (usedEmails.has(email) || await UserModel.exists({ email }));

        usedLogins.add(login);
        usedEmails.add(email);

        const password = Math.random().toString(36).slice(-5);
        const hashedPassword = await bcrypt.hash(password, 12);
        const otpCode = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

        tempUsers.push({
            login,
            email,
            password: hashedPassword,
            firstName: 'Temp',
            lastName: `User-${i + 1}`,
            role: 'client',
            groups,
            isVerified: false,
            otpCode,
            otpExpiresAt,
            isTempAccount: true,
            isOtpLogin: false,
        });

        plainPasswords.push({ login, email, password, otpCode });
    }

    await UserModel.insertMany(tempUsers);

    const messageHtml = `
      <h2 style="font-size: 20px;">Generated Temporary Users</h2>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; font-size: 18px; width: 100%;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th>#</th>
            <th>Login</th>
            <th>Email</th>
            <th>Password</th>
            <th>OTP Code</th>
          </tr>
        </thead>
        <tbody>
          ${plainPasswords.map((user, index) => `
            <tr>
              <td><b>${index + 1}</b></td>
              <td>${user.login}</td>
              <td>${user.email}</td>
              <td>${user.password}</td>
              <td>${user.otpCode}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const pdfPath = await generateUserPDFBuffer(messageHtml);

    await sendMail(
        [config.mailUser, config.superAdmin],
        'Your temporary user accounts',
        messageHtml,
        [
            {
                filename: 'users.pdf',
                content: pdfPath,
                contentType: 'application/pdf'
            }
        ]
    );

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: `${count} temporary users created successfully`,
    });
});

export const getUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { login, email } = req.query;

    const user = await UserModel.findOne({
        ...(login ? { login: login.toString() } : {}),
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


export const patchUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;

    const decodedId = decodeIdSafe(hashId);

    if (!decodedId) {
        throw new BadRequestError('Invalid or missing ID');
    }

    const updateData: any = {};
    const fieldsToUpdate = ['login', 'email', 'firstName', 'lastName', 'role', 'groups'];

    for (const field of fieldsToUpdate) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    if (req.body.groups && Array.isArray(req.body.groups)) {
        updateData.groups = req.body.groups
            .map((encoded: string) => decodeIdSafe(encoded))
            .filter((id: string): id is string => Boolean(id));
    }

    const user = await UserModel.findByIdAndUpdate(decodedId, updateData, {
        new: true,
        runValidators: true,
    }).select('-password -otpCode -otpExpiresAt');

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found',
        });
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User updated successfully',
        user,
    });
});

export const toggleUserActiveStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;
    const { activate } = req.body;

    if (!['true', 'false'].includes(String(activate))) {
        throw new BadRequestError('Invalid boolean value');
    }

    const realId = decodeIdSafe(hashId);
    if (!realId) {
        throw new BadRequestError('Invalid id provided');
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        realId,
        { isActive: activate === 'true' },
        { new: true, runValidators: true }
    ).select('-password -otpCode -otpExpiresAt');

    if (!updatedUser) {
        throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: `User active status set to ${activate}`,
        user: updatedUser,
    });
});


export const toggleManyUserStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { value } = req.body;
    const ids = req.body.ids as string[];

    if (!['true', 'false'].includes(String(value))) {
        throw new BadRequestError('Invalid boolean value');
    }

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new BadRequestError('Array of hashIds is required');
    }

    const decodedIds = ids
        .map(decodeIdSafe)
        .filter((id): id is string => Boolean(id));

    if (decodedIds.length === 0) {
        throw new BadRequestError('No valid IDs provided');
    }

    const result = await UserModel.updateMany(
        { _id: { $in: decodedIds } },
        { isActive: value === 'true' }
    );

    res.status(StatusCodes.OK).json({
        success: true,
        message: `Updated ${result.modifiedCount} user(s) to isActive=${value}`,
    });
});


export const updateMyselfUserData = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;


    const decodedId = decodeIdSafe(hashId);
    if (!decodedId) {
        throw new BadRequestError('Invalid or missing ID');
    }

    const updateData: any = {};
    const fieldsToUpdate = ['login', 'email', 'firstName', 'lastName'];

    for (const field of fieldsToUpdate) {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    const user = await UserModel.findByIdAndUpdate(decodedId, updateData, {
        new: true,
        runValidators: true,
    }).select('-password -otpCode -otpExpiresAt');

    if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found',
        });
        return;
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User updated successfully',
        user,
    });
});

export const deleteUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;
    const decodedId = decodeIdSafe(hashId);

    if (!decodedId) {
        throw new BadRequestError('Invalid or missing ID');
    }

    const deletedUser = await UserModel.findByIdAndDelete(decodedId);

    if (!deletedUser) {
        throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User deleted successfully',
    });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { login, email, role, group } = req.query;

    const filters: Record<string, any> = {};

    if (login) filters.login = { $regex: escapeRegex(login.toString()), $options: 'i' };
    if (email) filters.email = { $regex: escapeRegex(email.toString()), $options: 'i' };
    if (role) filters.role = role;
    if (group) filters.groups = new Types.ObjectId(group.toString());

    const [total, users] = await Promise.all([
        UserModel.countDocuments(filters),
        UserModel.find(filters)
            .skip(skip)
            .limit(limit)
            .select('-password -otpCode -otpExpiresAt -__v -updatedAt')
            .populate('groups', 'title')
            .lean()
    ]);

    const mappedUsers = users.map(user => {
        const examAttempts = (user.examAttempts || []).map((attempt: any) => ({
            ...omitFields(attempt, ['_id']),
            id: encodeId(attempt._id.toString()),
            exam: attempt.exam ? encodeId(attempt.exam.toString()) : null,
            answers: (attempt.answers || []).map((ans: any) => ({
                ...omitFields(ans, ['_id']),
                id: encodeId(ans._id.toString())
            }))
        }));

        const { _id, ...restUser } = omitFields(user, ['_id']);

        return {
            ...restUser,
            id: _id ? encodeId(_id.toString()) : null,
            groups: (user.groups || []).map((g: any) => {
                const { _id, ...rest } = g;
                return {
                    ...rest,
                    id: encodeId(_id.toString())
                };
            }),
            examAttempts
        };
    });


    const totalPages = Math.ceil(total / limit);

    res.status(StatusCodes.OK).json({
        users: mappedUsers,
        total,
        totalPages,
        currentPage: page,
        usersPerPage: mappedUsers.length
    });
});
