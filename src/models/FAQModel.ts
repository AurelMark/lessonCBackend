import { createLocalizedSchema } from '@/utils/createLocalizedSchema';
import { model, Schema } from 'mongoose';

export type TFAQItem = {
    title: Record<string, string>;
    question: Record<string, string>;
    answer: Record<string, string>;
};

const FAQItemSchema = new Schema<TFAQItem>({
    title: createLocalizedSchema(),
    question: createLocalizedSchema(),
    answer: createLocalizedSchema(),
});

const FAQSchema = new Schema(
    {
        items: [FAQItemSchema],
    },
    { timestamps: true }
);

const FAQModel = model('FAQ', FAQSchema);
export default FAQModel;
