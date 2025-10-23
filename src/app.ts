import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import errorHandlerMiddleware from '@/middleware/errorHandlerMiddleware';
import newsRouter from '@/routers/newsRouter';
import blogRouter from '@/routers/blogRouter';
import dictionaryRouter from '@/routers/dictionaryRouter';
import courseRouter from '@/routers/courseRouter';
import uploadsRouter from '@/routers/uploadsRouter';
import userRouter from '@/routers/userRouter';
import authRouter from '@/routers/authRouter';
import groupRouter from '@/routers/groupRouter';
import lessonRouter from '@/routers/lessonRouter';
import examenRouter from '@/routers/examRouter';
import contactsRouter from '@/routers/contactsRouter';
import statsLogRouter from '@/routers/statsRouter';
import clientRouter from '@/routers/clientRouter';
import homepageRouter from '@/routers/homepageRouter';
import faqRouter from '@/routers/faqRouter';
import aboutUsRouter from '@/routers/aboutUsRouter';
import { authenticateUser } from './middleware/authMiddleware';
import helmet from 'helmet';
import { limiter } from './utils/limiter';

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://192.168.0.107:3000'],
    credentials: true,
}));

app.set('trust proxy', 1);
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads/public', express.static(path.join(__dirname, '..', 'uploads', 'public')));

app.use('/uploads/private', authenticateUser, express.static(path.join(__dirname, '..', 'uploads', 'private')));

app.use(helmet());

app.use('/api/auth', authRouter);

app.use('/api/blog', blogRouter);

app.use('/api/contacts', contactsRouter);

app.use('/api/course', courseRouter);

app.use('/api/dictionary', dictionaryRouter);

app.use('/api/exam', examenRouter);

app.use('/api/lesson', lessonRouter);

app.use('/api/group', groupRouter);

app.use('/api/news', newsRouter);

app.use('/api/stats', statsLogRouter);

app.use('/api/user', userRouter);

app.use('/api/uploads', uploadsRouter);

app.use('/api/client', clientRouter);

app.use('/api/homepage', homepageRouter);

app.use('/api/faq', faqRouter);

app.use('/api/about-us', aboutUsRouter);

app.use(errorHandlerMiddleware);


export default app;