import { Schema, model, Types } from 'mongoose';
import { createLocalizedSchema } from '@/utils/createLocalizedSchema';

export type TExam = {
    title: Record<string, string>;
    description: Record<string, string>;
    content: Record<string, string>;
    imageUrl: string;
    slug: string;
    createdBy: Types.ObjectId;
    responsible: Types.ObjectId[];
    lessons?: Types.ObjectId[];
    groups?: Types.ObjectId[];
    questions: {
        title: string;
        optionFile?: string;
        options: {
            content: string;
            isAnswer: boolean;
            order: number;
        }[];
        order: number;
    }[];
    deadline?: Date;
    isActive: boolean;
    attempts?: {
        user: Types.ObjectId;
        score: number;
        submittedAt: Date;
        answers: {
            questionIndex: number;
            selectedOptionIndex: number;
            correct: boolean;
        }[];
    }[];
};

const ExamSchema = new Schema<TExam>(
    {
        title: createLocalizedSchema(),
        description: createLocalizedSchema(),
        content: createLocalizedSchema(),
        imageUrl: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        responsible: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
        groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
        questions: [
            {
                title: { type: String, required: true },
                optionFile: { type: String },
                options: [
                    {
                        content: { type: String, required: true },
                        isAnswer: { type: Boolean, default: false },
                        order: { type: Number, default: 0 },
                    }
                ],
                order: { type: Number, default: 0 },
            }
        ],
        deadline: { type: Date },
        isActive: { type: Boolean, default: true },
        attempts: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                answers: [
                    {
                        questionIndex: { type: Number, required: true },
                        selectedOptionIndex: { type: Number, required: true },
                        correct: { type: Boolean, required: true }
                    }
                ],
                score: { type: Number, required: true },
                submittedAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

const ExamModel = model<TExam>('Exam', ExamSchema);
export default ExamModel;
