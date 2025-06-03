import nodemailer, { SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';
import config from '@/config/config';
dotenv.config();

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.mailUser,
        pass: config.mailPass
    }
});

export const sendMail = async (
    to: string | string[],
    subject: string,
    html: string,
    attachments?: SendMailOptions['attachments']
) => {
    const mailOptions: SendMailOptions = {
        from: `"Phonetics Learning Centre" <${config.mailUser}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
    };

    if (attachments) {
        mailOptions.attachments = attachments;
    }

    await transporter.sendMail(mailOptions);
};
