import { applyGlobalMongoosePlugins } from '@/loaders/mongoosePlugins';
import { createUploadsFolder } from '@/loaders/createUploadsFolder';
applyGlobalMongoosePlugins();

import app from '@/app';
import config from '@/config/config';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function turnOnServer() {
    createUploadsFolder();

    try {
        await mongoose.connect(config.mongoUrl);
        console.log('✅ Connected to MongoDB');
        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
        });
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

turnOnServer();