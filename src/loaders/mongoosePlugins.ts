import { encryptIdPlugin } from '@/plugins/encryptIdPlugin';
import mongoose from 'mongoose';

export function applyGlobalMongoosePlugins() {
    mongoose.plugin(encryptIdPlugin);
}
