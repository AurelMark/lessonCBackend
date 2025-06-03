import { model, Schema, Types } from 'mongoose';
import { createLocalizedSchema } from '@/utils/createLocalizedSchema';

export type TGroupModel = {
    title: Record<string, string>;
    users: Types.ObjectId[];
    lessons: Types.ObjectId[];
    exams: Types.ObjectId[];
    responsible: Types.ObjectId[];
    createdBy: Types.ObjectId;
};

const GroupSchema = new Schema<TGroupModel>({
    title: createLocalizedSchema(),
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
    }],
    lessons: [{
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
        default: [],
    }],
    exams: [{
        type: Schema.Types.ObjectId,
        ref: 'Exam',
        default: [],
    }],
    responsible: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const GroupModel = model<TGroupModel>('Group', GroupSchema);
export default GroupModel;