import mongoose, { Document, Schema } from 'mongoose';

export interface ISensor extends Document {
    MACAddress: string;
    user?: mongoose.Types.ObjectId;
    name?: string;
    sampleFrequencyHz?: number;
    createdAt: Date;
    updatedAt: Date;
}

const SensorSchema = new Schema<ISensor>(
    {
        MACAddress: {
            type: String,
            required: [true, 'MAC Address is required'],
            unique: true,
            trim: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        name: {
            type: String,
            trim: true,
        },
        sampleFrequencyHz: {
            type: Number,
            required: false,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ISensor>('Sensor', SensorSchema);
