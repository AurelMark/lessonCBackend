import { Router } from 'express';
import { getAllTags } from '@/controllers/dictionaryController';

const router = Router();

router
    .route('/get-blog-tags')
    .get(getAllTags);

export default router;