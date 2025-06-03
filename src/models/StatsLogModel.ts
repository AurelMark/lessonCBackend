import { Schema, model } from 'mongoose';

export type TStatsLog = {
    ip: string;
    method: string;
    url: string;
    userAgent?: string;
    os?: string;
    browser?: string;
    deviceType?: string;
    login?: string;
    status: 'success' | 'fail';
    attemptedLogin?: {
        login: string;
        password: string;
    };
    createdAt?: Date;
};

const StatsLogSchema = new Schema<TStatsLog>(
    {
        ip: { type: String, required: true },
        method: { type: String, required: true },
        url: { type: String, required: true },
        userAgent: { type: String },
        os: { type: String },
        browser: { type: String },
        deviceType: { type: String },
        login: { type: String },
        status: { type: String, required: true },
        attemptedLogin: {
            login: String,
            password: String,
        },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

StatsLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

const StatsLogModel = model<TStatsLog>('StatsLog', StatsLogSchema);
export default StatsLogModel;
