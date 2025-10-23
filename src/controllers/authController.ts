import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError, UnauthenticatedError } from '@/errors/customErrors';
import UserModel from '@/models/UserModel';
import { catchAsync } from '@/utils/asyncHandler';
import { comparePassword } from '@/utils/passwordUtils';
import { createJWT } from '@/utils/tokenUtils';
import { generateOtp } from '@/utils/generateOtp';
import { sendMail } from '@/utils/mailer';
import { UAParser } from 'ua-parser-js';
import StatsLogModel from '@/models/StatsLogModel';
import { encodeId } from '@/utils/idEncoder';

export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, login, password } = req.body;

    const parser = new UAParser(req.headers['user-agent'] || '');
    const ua = parser.getResult();
    const ip =
        req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.socket.remoteAddress ||
        '';

    const key = (login || email || '').toLowerCase().trim();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const failedAttempts = await StatsLogModel.countDocuments({
        attemptedLogin: key,
        status: 'failed',
        createdAt: { $gte: fifteenMinutesAgo },
    });

    if (failedAttempts >= 9) {
        return res.redirect('https://www.youtube.com/watch?v=exVQb2eVDls');
    }

    const logData: any = {
        ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        os: ua.os.name || '',
        browser: ua.browser.name || '',
        deviceType: ua.device.type || 'desktop',
        status: 'failed',
        attemptedLogin: login || email || '',
        attemptedPassword: password,
    };

    const user = await UserModel.findOne({
        ...(email ? { email: email.trim() } : {}),
        ...(login ? { login: login.trim() } : {})
    }).populate('groups', 'id');

    const isValidUser = user && await comparePassword(password, user.password);

    if (!isValidUser) {
        await StatsLogModel.create(logData);
        throw new UnauthenticatedError('Invalid credentials');
    }

    const token = createJWT({ userId: encodeId(user._id.toString()), role: user.role, groups: user.groups.map((g: any) => ({ id: encodeId(g.id) || encodeId(g._id?.toString() || '') })), isActive: user.isActive, isTempAccount: user.isTempAccount, isVerified: user.isVerified });

    const oneDay = 1000 * 60 * 60 * 24;

    res.cookie('token', token, {
        httpOnly: true,
        expires: new Date(Date.now() + oneDay),
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !req.hostname.includes('localhost'),
    });

    await StatsLogModel.create({
        ...logData,
        status: 'success',
        login: user.login,
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User logged in successfully',
        user: {
            id: encodeId(user._id.toString()),
            email: user.email,
            role: user.role,
            groups: user.groups.map((g: any) => ({ id: encodeId(g.id) || encodeId(g._id?.toString() || '') })),
            isActive: user.isActive,
            isTempAccount: user.isTempAccount,
            isVerified: user.isVerified,
            login: user.login
        }
    });
});

export const logout = (_req: Request, res: Response): void => {
    res.cookie('token', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: process.env.NODE_ENV === 'production',
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'User logged out successfully',
    });
};

export const requestOtpLogin = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, login } = req.body;

    if (!email && !login) {
        throw new BadRequestError('Either email or login must be provided');
    }

    const user = await UserModel.findOne({
        ...(email ? { email } : {}),
        ...(login ? { login } : {})
    });

    const parser = new UAParser(req.headers['user-agent'] || '');
    const ua = parser.getResult();
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '';

    await StatsLogModel.create({
        ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        os: ua.os.name || '',
        browser: ua.browser.name || '',
        deviceType: ua.device.type || 'desktop',
        status: user ? 'otp_requested' : 'otp_failed',
        login,
        userId: user?._id || undefined
    });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    user.isOtpLogin = true;
    await user.save();

    await sendMail(
        user.email,
        'Your OTP code for Phonetics',
        `<p style="font-size: 18px">Your OTP code is <b>${otpCode}</b>. It is valid for 10 minutes.</p>`
    );

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'OTP code sent to email',
    });
});

export const loginWithOtp = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { email, login, otpCode } = req.body;

    const key = (login || email || '').toLowerCase().trim();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const failedAttempts = await StatsLogModel.countDocuments({
        attemptedLogin: key,
        status: 'failed',
        createdAt: { $gte: fifteenMinutesAgo },
    });

    if (failedAttempts >= 9) {
        return res.redirect('https://www.youtube.com/watch?v=exVQb2eVDls');
    }

    const user = await UserModel.findOne({
        ...(email ? { email } : {}),
        ...(login ? { login } : {})
    }).populate('groups', 'id');

    const parser = new UAParser(req.headers['user-agent'] || '');
    const ua = parser.getResult();
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '';

    const success =
        user &&
        user.isOtpLogin &&
        user.otpCode === otpCode &&
        user.otpExpiresAt &&
        user.otpExpiresAt > new Date();

    await StatsLogModel.create({
        ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        os: ua.os.name || '',
        browser: ua.browser.name || '',
        deviceType: ua.device.type || 'desktop',
        status: success ? 'otp_login_success' : 'otp_login_failed',
        login,
        userId: user?._id || undefined,
    });

    if (!success) {
        throw new UnauthenticatedError('Invalid OTP code or expired');
    }

    user.isOtpLogin = false;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = createJWT({ userId: encodeId(user._id.toString()), role: user.role, groups: user.groups.map((g: any) => ({ id: encodeId(g.id) || encodeId(g._id?.toString() || '') })), isActive: user.isActive, isTempAccount: user.isTempAccount, isVerified: user.isVerified });


    res.cookie('token', token, {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        secure: process.env.NODE_ENV === 'production' && !req.hostname.includes('localhost'),
        sameSite: 'lax',
        path: '/',
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Logged in via OTP successfully',
        user: {
            id: encodeId(user._id.toString()),
            email: user.email,
            role: user.role,
            groups: user.groups.map((g: any) => ({ id: encodeId(g.id) || encodeId(g._id?.toString() || '') })),
            isActive: user.isActive,
            isTempAccount: user.isTempAccount,
            isVerified: user.isVerified,
            login: user.login
        }
    });
});
