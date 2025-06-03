import { model, Schema } from 'mongoose';
import { createLocalizedSchema } from '@/utils/createLocalizedSchema';

export type TCourseProps = {
    title: Record<string, string>;
    description: Record<string, string>;
    content: Record<string, string>;
    imageUrl: string;
    slug: string;
    features: {
        lectures: string;
        quizzes: string;
        duration: number;
        durationType: string;
        skillLevel: string;
        language: string;
        students: number;
        asssessments: boolean;
    },
    alert?: {
        type: string;
        color: string;
        content: Record<string, string>;
    }[];
};

const CourseSchema = new Schema<TCourseProps>({
    title: createLocalizedSchema(),
    description: createLocalizedSchema(),
    content: createLocalizedSchema(),
    imageUrl: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    features: {
        lectures: { type: String, required: true },
        quizzes: { type: String, required: true },
        duration: { type: Number, required: true },
        durationType: { type: String, required: true },
        skillLevel: { type: String, required: true },
        language: { type: String, required: true },
        students: { type: Number, required: true },
        asssessments: { type: Boolean, required: true }
    },
    alert: [
        {
            type: {
                type: String,
                required: true,
            },
            color: {
                type: String,
                required: true,
            },
            content: createLocalizedSchema(),
        },
    ]
}, { timestamps: true });

const CourseModel = model<TCourseProps>('Course', CourseSchema);
export default CourseModel;