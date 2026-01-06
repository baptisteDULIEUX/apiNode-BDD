import mongoose, { Schema, Document } from 'mongoose';

export interface ISensorData extends Document {
    userId: string;
    timestamp: Date;
    accelerometer1: Map<string, number>;
    accelerometer2: Map<string, number>;
    heartRate: Map<string, number>;
    temperature: Map<string, number>;
    reactionTimes: number[];
    userData: Map<string, any>;
}

const SensorDataSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    accelerometer1: { type: Map, of: Number },
    accelerometer2: { type: Map, of: Number },
    heartRate: { type: Map, of: Number },
    temperature: { type: Map, of: Number },
    reactionTimes: [{ type: Number }],
    userData: { type: Map, of: Schema.Types.Mixed }
});

export default mongoose.model<ISensorData>('SensorData', SensorDataSchema);

