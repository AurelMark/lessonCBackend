import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { BadRequestError, NotFoundError } from '@/errors/customErrors';
import { catchAsync } from '@/utils/asyncHandler';
import { Request, Response } from 'express';
import ContactsModel from '@/models/ContactsModel';
import { StatusCodes } from 'http-status-codes';
import { sendMail } from '@/utils/mailer';
import { decodeIdSafe, encodeId } from '@/utils/idEncoder';
import mongoose from 'mongoose';

export const createContact = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, message, phone, email } = req.body;

    const phoneNumber = parsePhoneNumberFromString(phone);
    if (!phoneNumber || !phoneNumber.isValid()) {
        throw new BadRequestError('Invalid phone number');
    }

    await ContactsModel.create({ firstName, lastName, message, phone, email });
    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Successfully send message',
    });
});

export const getAllContacts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const skip = (page - 1) * limit;
    const searchFilter: any = {};

    const totalContacts = await ContactsModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalContacts / limit);

    const contacts = await ContactsModel.find(searchFilter)
        .skip(skip)
        .limit(limit)
        .lean();

    const result = contacts.map(contact => {

        const { _id, ...rest } = contact;
        return {
            id: _id ? encodeId(_id.toString()) : null,
            ...rest
        };
    });

    res.status(StatusCodes.OK).json({
        data: result,
        total: totalContacts,
        totalPages,
        currentPage: page,
        contactsPerPage: result.length
    });
});


export const deleteContact = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { hashId } = req.params;

    const realId = decodeIdSafe(hashId);
    const contact = await ContactsModel.findById(realId);
    if (!contact) {
        throw new NotFoundError('Contact not found');
    }

    await contact.deleteOne();

    res.status(StatusCodes.OK).json({ message: 'Contact deleted successfully' });
});

export const sendContactReply = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id, email, fullName, subject, message } = req.body;

    console.log('req', req.body);

    const realId = decodeIdSafe(id);



    if (realId) {
        await ContactsModel.updateOne(
            { _id: new mongoose.Types.ObjectId(realId) },
            { $set: { isReply: true } }
        );
        const htmlContent = `
      <h2>${fullName},</h2>
      <p style="font-size:16px">${message}</p>
      <br/>
      <p>Best regards,<br/>Phonetics Learning Centre</p>
    `;

        await sendMail(
            email,
            subject,
            htmlContent
        );
    }

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Response message sent successfully to the user.',
    });
});
