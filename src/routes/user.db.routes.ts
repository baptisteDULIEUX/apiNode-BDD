import express, { Request, Response } from 'express';
import User from '../models/User';
import SessionData from '../models/SessionData';
import Sensor from '../models/Sensor';

const router = express.Router();

// Récupérer toutes les données d'un utilisateur
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { limit = 100, skip = 0 } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const data = await SessionData.find({ sensor: { $in: user.sensors } })
            .sort({ sessionTimestamp: -1 })
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
router.get('/:userId/range', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const query: any = { sensor: { $in: user.sensors } };

        if (startDate || endDate) {
            query.sessionTimestamp = {};
            if (startDate) query.sessionTimestamp.$gte = new Date(startDate as string);
            if (endDate) query.sessionTimestamp.$lte = new Date(endDate as string);
        }

        const data = await SessionData.find(query).sort({ sessionTimestamp: -1 });

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

// Ajout d'adresses MAC aux utilisateurs
router.post('/:userId/macs', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { MACs } = req.body;

        if (!Array.isArray(MACs) || MACs.some(mac => typeof mac !== 'string')) {
            return res.status(400).json({
                success: false,
                message: 'The list of MACs must be an array of strings'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User does not exist' });
        }

        const sensorIds = [];
        for (const mac of MACs) {
            let sensor = await Sensor.findOne({ MACAddress: mac });
            if (!sensor) {
                sensor = new Sensor({ MACAddress: mac, user: user._id });
                await sensor.save();
            } else if (!sensor.user) {
                sensor.user = user._id;
                await sensor.save();
            }
            sensorIds.push(sensor._id);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { sensors: { $each: sensorIds } } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'MAC addresses added successfully',
            data: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error adding MAC addresses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Suppression d'une ou plusieurs adresses MAC d'un utilisateur
router.delete('/:userId/macs', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { MACs } = req.body;

        if (!Array.isArray(MACs) || MACs.some(mac => typeof mac !== 'string')) {
            return res.status(400).json({
                success: false,
                message: 'The list of MACs must be an array of strings'
            });
        }

        const sensors = await Sensor.find({ MACAddress: { $in: MACs } });
        const sensorIds = sensors.map(s => s._id);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pullAll: { sensors: sensorIds } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist'
            });
        }

        // Optionally, we could remove the `user` reference from the sensors here
        await Sensor.updateMany({ _id: { $in: sensorIds } }, { $unset: { user: 1 } });

        return res.status(200).json({
            success: true,
            message: 'MAC addresses removed successfully',
            data: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error removing MAC addresses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Retourner tous les sensors d'un utilisateur
router.get('/:userId/sensors', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate('sensors');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist'
            });
        }

        return res.status(200).json({
            success: true,
            count: user.sensors.length,
            data: user.sensors
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching sensors',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
