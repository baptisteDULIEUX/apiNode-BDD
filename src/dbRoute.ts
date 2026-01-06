import express, { Request, Response } from 'express';
import SensorData from './models/SensorData';

const router = express.Router();

// Stocker des données en BDD
router.post('/store', async (req: Request, res: Response) => {
    try {
        const {
            userId,
            accelerometer1,
            accelerometer2,
            heartRate,
            temperature,
            reactionTimes,
            userData
        } = req.body;

        const sensorData = new SensorData({
            userId,
            accelerometer1: new Map(Object.entries(accelerometer1 || {})),
            accelerometer2: new Map(Object.entries(accelerometer2 || {})),
            heartRate: new Map(Object.entries(heartRate || {})),
            temperature: new Map(Object.entries(temperature || {})),
            reactionTimes: reactionTimes || [],
            userData: new Map(Object.entries(userData || {}))
        });

        await sensorData.save();

        res.status(201).json({
            success: true,
            message: 'Data stored successfully',
            data: sensorData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error storing data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Récupérer toutes les données d'un utilisateur
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { limit = 100, skip = 0 } = req.query;

        const data = await SensorData.find({ userId })
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Récupérer les données par plage de dates
router.get('/user/:userId/range', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const query: any = { userId };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate as string);
            if (endDate) query.timestamp.$lte = new Date(endDate as string);
        }

        const data = await SensorData.find(query).sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving data by range',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Récupérer les dernières données d'un utilisateur
router.get('/user/:userId/latest', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const data = await SensorData.findOne({ userId }).sort({ timestamp: -1 });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'No data found for this user'
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving latest data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Supprimer les données d'un utilisateur
router.delete('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const result = await SensorData.deleteMany({ userId });

        res.status(200).json({
            success: true,
            message: 'Data deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;

