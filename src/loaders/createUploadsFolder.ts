import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const createUploadsFolder = () => {
    const uploadsPath = join(__dirname, '..', '..', 'uploads');

    if (!existsSync(uploadsPath)) {
        mkdirSync(uploadsPath, { recursive: true });
        console.log('✅ uploads/ folder created');
    } else {
        console.log('✅ uploads/ folder already exists');
    }
};
