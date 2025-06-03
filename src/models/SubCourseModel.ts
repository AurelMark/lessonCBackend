import { model, Schema } from 'mongoose';
import { createLocalizedSchema } from '@/utils/createLocalizedSchema';

export type TSubCourseProps = {
    title: Record<string, string>;
    description: Record<string, string>;
    imageUrl: string;
    price: number;
    courseSlug?: string;
};

const SubCourseSchema = new Schema<TSubCourseProps>({
    title: createLocalizedSchema(),
    description: createLocalizedSchema(),
    imageUrl: { type: String, required: true },
    price: {
        type: Number, required: true
    },
    courseSlug: { type: String, required: false }
}, { timestamps: true });

const SubCourseModel = model<TSubCourseProps>('SubCourse', SubCourseSchema);
export default SubCourseModel;