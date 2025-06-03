import { Router } from 'express';
import { getAllBlogNews, getBlogNews } from '@/controllers/blogController';

const router = Router();

router
    .route('/')
    .get(getAllBlogNews);
router
    .route('/:slug')
    .get(getBlogNews);

export default router;