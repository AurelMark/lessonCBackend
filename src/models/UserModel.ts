import { Schema, model, Types } from 'mongoose';

export type TRole = 'user' | 'client' | 'teacher' | 'journalist' | 'assistant' | 'admin';

export type TUser = {
    login: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: TRole;
    groups: Types.ObjectId[];
    isVerified: boolean;
    otpCode?: string;
    otpExpiresAt?: Date;
    isTempAccount: boolean;
    isActive: boolean;
    isOtpLogin?: boolean;
    examAttempts?: {
        exam: Types.ObjectId;
        score: number;
        submittedAt: Date;
        answers: {
            questionIndex: number;
            selectedOptionIndex: number;
        }[];
    }[]
};

const UserSchema = new Schema<TUser>({
    login: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: {
        type: String,
        enum: ['user', 'client', 'teacher', 'journalist', 'assistant', 'admin'],
        required: true,
        default: 'user'
    },
    groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    isTempAccount: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isOtpLogin: { type: Boolean, default: false },
    examAttempts: [
        {
            exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
            score: { type: Number, required: true },
            submittedAt: { type: Date, default: () => new Date() },
            answers: [
                {
                    questionIndex: { type: Number, required: true },
                    selectedOptionIndex: { type: Number, required: true },
                }
            ]
        }
    ]
}, { timestamps: true });

UserSchema.methods.toJSON = function () {
    let obj = this.toObject();
    delete obj.password;
    return obj;
};

const UserModel = model<TUser>('User', UserSchema);
export default UserModel;