import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoneTestResult extends Document {
    userId: mongoose.Types.ObjectId;
    testType: 'REACTION_TIME' | 'AUDIO_ANALYSIS';
    results: {
        // REACTION_TIME fields
        times?: number[];
        average?: number;

        // AUDIO_ANALYSIS fields
        duration?: number;
        pitchMean?: number;
        pitchStdDev?: number;
        rmsMean?: number;
        mfccMean?: number[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const PhoneTestResultSchema = new Schema<IPhoneTestResult>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        testType: {
            type: String,
            enum: ['REACTION_TIME', 'AUDIO_ANALYSIS'],
            required: [true, 'Test type is required'],
        },
        results: {
            type: Schema.Types.Mixed,
            required: [true, 'Results are required'],
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IPhoneTestResult>('PhoneTestResult', PhoneTestResultSchema);
