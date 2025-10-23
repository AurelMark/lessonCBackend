import { createLocalizedSchema } from '@/utils/createLocalizedSchema';
import { model, Schema } from 'mongoose';

export type TAboutUs = {
    title: Record<string, string>;
    context: Record<string, string>;
}

const AboutUsSchema = new Schema<TAboutUs>(
    {
        title: createLocalizedSchema(),
        context: createLocalizedSchema(),
    },
    { timestamps: true }
);

const AboutUsModel = model<TAboutUs>('AboutUs', AboutUsSchema);
export default AboutUsModel;