import { model, Schema } from 'mongoose';
import { createLocalizedSchema } from '@/utils/createLocalizedSchema';

export type TNewsProps = {
    title: Record<string, string>;
    description: Record<string, string>;
    tags: string[];
    content: Record<string, string>;
    imageUrl: string;
    slug: string
};

const NewsSchema = new Schema<TNewsProps>({
    title: createLocalizedSchema(),
    description: createLocalizedSchema(),
    tags: {
        type: [String],
        default: [],
        required: true
    },
    content: createLocalizedSchema(),
    imageUrl: { type: String, required: true },
    slug: { type: String, required: true, unique: true }
}, { timestamps: true });

const NewsModel = model<TNewsProps>('News', NewsSchema);
export default NewsModel;