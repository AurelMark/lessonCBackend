import { createLocalizedSchema } from '@/utils/createLocalizedSchema';
import { model, Schema } from 'mongoose';

export type THomepage = {
    slider: {
        title: Record<string, string>;
        description: Record<string, string>;
        imageUrl: string;
        link: string;
    }[],
    education: {
        title: Record<string, string>;
        description: Record<string, string>;
        imageUrl: string;
        link: string;
    }[],
    info: {
        title: Record<string, string>;
        description: Record<string, string>;
        imageUrl: string;
        link: string;
    }[],
}

const HomepageSchema = new Schema<THomepage>(
    {
        slider: [
            {
                title: createLocalizedSchema(),
                description: createLocalizedSchema(),
                imageUrl: { type: String, required: true },
                link: { type: String }
            }
        ],
        education: [
            {
                title: createLocalizedSchema(),
                description: createLocalizedSchema(),
                imageUrl: { type: String, required: true },
                link: { type: String }
            }
        ],
        info: [
            {
                title: createLocalizedSchema(),
                description: createLocalizedSchema(),
                imageUrl: { type: String, required: true },
                link: { type: String }
            }
        ],
    },
    { timestamps: true }
);

const HomepageModel = model<THomepage>('Homepage', HomepageSchema);
export default HomepageModel;