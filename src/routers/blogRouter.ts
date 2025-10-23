import { Router } from 'express';
import { getAllBlogNews, getBlogNews } from '@/controllers/blogController';
import { apiLimiter } from '@/utils/helmetHandler';

const router = Router();

router
    .route('/')
    .get(
        apiLimiter, 
        getAllBlogNews
    );
router
    .route('/:slug')
    .get(
        apiLimiter, 
        getBlogNews
    );

export default router;