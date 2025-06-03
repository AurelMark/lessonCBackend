import { Schema, model, Types } from 'mongoose';
import { createLocalizedSchema } from '@/utils/createLocalizedSchema';

export type TLesson = {
    title: Record<string, string>;
    description: Record<string, string>;
    content: Record<string, string>;
    imageUrl: string;
    slug: string;
    createdBy: Types.ObjectId;
    materials: {
        name: string;
        type: string;
        url: string;
        order: number;
    }[];
    groups?: Types.ObjectId[];
    examen?: Types.ObjectId[];
    isActive: boolean;
};

const LessonSchema = new Schema<TLesson>(
    {
        title: createLocalizedSchema(),
        description: createLocalizedSchema(),
        content: createLocalizedSchema(),
        imageUrl: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        materials: [
            {
                name: { type: String, required: true },
                type: { type: String, required: true },
                url: { type: String, required: true },
                order: { type: Number, default: 0 },
            }
        ],
        groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
        examen: [{ type: Schema.Types.ObjectId, ref: 'Exam' }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const LessonModel = model<TLesson>('Lesson', LessonSchema);
export default LessonModel;