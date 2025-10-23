import multer from 'multer';
import slugify from 'slugify';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const { scope, category, folder } = req.params;

        if (!scope || !category) {
            return cb(new Error('Missing scope or category'), '');
        }

        const safeCategory = slugify(category, { lower: true, strict: true });
        const uploadParts = [process.cwd(), 'uploads', scope, safeCategory];

        if (folder) {
            const safeFolder = slugify(folder, { lower: true, strict: true });
            uploadParts.push(safeFolder);
        }

        const uploadPath = path.join(...uploadParts);

        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const { scope, category, folder } = req.params;

        const safeCategory = slugify(category, { lower: true, strict: true });
        const uploadParts = [process.cwd(), 'uploads', scope, safeCategory];

        if (folder) {
            const safeFolder = slugify(folder, { lower: true, strict: true });
            uploadParts.push(safeFolder);
        }

        const uploadDir = path.join(...uploadParts);

        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);

        const safeBase = slugify(base, { lower: true, strict: true });
        let filename = `${safeBase}${ext}`;
        let counter = 1;

        while (fs.existsSync(path.join(uploadDir, filename))) {
            filename = `${safeBase}-${counter}${ext}`;
            counter++;
        }

        cb(null, filename);
    }

});

export const uploadMiddleware = multer({
    storage,
    limits: { files: 100 }
}).array('files', 100);
