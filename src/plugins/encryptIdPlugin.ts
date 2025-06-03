import { Schema } from 'mongoose';
import { encodeId } from '@/utils/idEncoder';

export function encryptIdPlugin(schema: Schema) {
    schema.set('toJSON', {
        transform: (_doc, ret) => {
            ret.id = encodeId(ret._id.toString());
            delete ret._id;
            delete ret.__v;
            delete ret.updatedAt;
            return ret;
        }
    });
}
