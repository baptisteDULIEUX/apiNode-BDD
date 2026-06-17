import express, { Request, Response } from 'express';
import SessionData from '../models/SessionData';
import Sensor from '../models/Sensor';

const router = express.Router();

// Stocker des données en BDD
router.post('/store', async (req: Request, res: Response) => {
    try {
        const {
            macAddress,
            accelerometer1,
            accelerometer2,
            heartRate,
            temperature,
            reactionTimes,
            userData,
            samplingFrequencyHz
        } = req.body;

        const targetMac = macAddress || '00:00:00:00:00:00';

        // Find or create the sensor based on MACAddress
        let sensor = await Sensor.findOne({ MACAddress: targetMac });
        if (!sensor) {
            sensor = new Sensor({ MACAddress: targetMac, samplingFrequencyHz });
            await sensor.save();
        } else if (samplingFrequencyHz !== undefined && sensor.samplingFrequencyHz !== samplingFrequencyHz) {
            sensor.samplingFrequencyHz = samplingFrequencyHz;
            await sensor.save();
        }

        // Create a new session
        const sessionData = new SessionData({
            sensor: sensor._id,
            accelerometer1: new Map(Object.entries(accelerometer1 || {})),
            accelerometer2: new Map(Object.entries(accelerometer2 || {})),
            heartRate: new Map(Object.entries(heartRate || {})),
            temperature: new Map(Object.entries(temperature || {})),
            reactionTimes: reactionTimes || [],
            userData: new Map(Object.entries(userData || {}))
        });

        await sessionData.save();

        return res.status(201).json({
            success: true,
            message: 'Session data created successfully',
            data: sessionData
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error processing sensor data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
