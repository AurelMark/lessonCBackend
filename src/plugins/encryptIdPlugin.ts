import { Schema } from 'mongoose';
import { encodeId } from '@/utils/idEncoder';

export function encryptIdPlugin(schema: Schema) {
    schema.set('toJSON', {
        transform: (_doc, ret: { __v?: any; [key: string]: any }) => {
            ret.id = encodeId(ret._id.toString());
            delete ret._id;
            if ('__v' in ret) delete ret.__v;
            if ('updatedAt' in ret) delete ret.updatedAt;
            return ret;
        }
    });
}
