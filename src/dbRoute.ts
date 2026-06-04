import express, { Request, Response } from 'express';
import SensorData from './models/SensorData';
import User from "./models/User";

const router = express.Router();

// Stocker des données en BDD
router.post('/store', async (req: Request, res: Response) => {
    try {
        const {
            macAddress, // Reçu du client (souvent en camelCase)
            accelerometer1,
            accelerometer2,
            heartRate,
            temperature,
            reactionTimes,
            userData
        } = req.body;

        const targetMac = macAddress || '00:00:00:00:00:00';
        const existingData = await SensorData.findOne({ MACAddress: targetMac }).sort({ timestamp: -1 });

        if (existingData) {
            // --- MODE MISE À JOUR ---

            // Liste des champs
            const mapFields = ['accelerometer1', 'accelerometer2', 'heartRate', 'temperature', 'userData'] as const;

            for (const field of mapFields) {
                const newDataForField = req.body[field];
                if (newDataForField) {
                    // fusion des données, champ existant + nouveau
                    Object.entries(newDataForField).forEach(([key, val]) => {
                        existingData[field].set(key, val as number);
                    });
                }
            }
            if (req.body.reactionTimes) {
                existingData.reactionTimes.push(...req.body.reactionTimes);
            }

            existingData.timestamp = new Date();

            await existingData.save();

            return res.status(200).json({
                success: true,
                message: 'Sensor data updated successfully',
                data: existingData
            });
        } else {
            // --- MODE CRÉATION ---
            const sensorData = new SensorData({
                MACAddress: targetMac,
                accelerometer1: new Map(Object.entries(accelerometer1 || {})),
                accelerometer2: new Map(Object.entries(accelerometer2 || {})),
                heartRate: new Map(Object.entries(heartRate || {})),
                temperature: new Map(Object.entries(temperature || {})),
                reactionTimes: reactionTimes || [],
                userData: new Map(Object.entries(userData || {}))
            });

            await sensorData.save();

            return res.status(201).json({
                success: true,
                message: 'Sensor data created successfully',
                data: sensorData
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error processing sensor data',
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
router.post('/user/:userId/macs', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { MACs } = req.body;

        // Validation du format
        if (!Array.isArray(MACs) || MACs.some(mac => typeof mac !== 'string')) {
            return res.status(400).json({
                success: false,
                message: 'The list of MACs must be an array of strings'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $addToSet: { MACAddresses: { $each: MACs } } }, // $each est correct ici
          { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist'
            });
        }

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

// Supprimer les données d'un utilisateur
router.delete('/user/:userId/macs', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { MACs } = req.body;

        // Validation de sécurité pour le tableau
        if (!Array.isArray(MACs)) {
            return res.status(400).json({
                success: false,
                message: 'The list of MACs must be an array'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $pullAll: { MACAddresses: MACs } },
          { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist'
            });
        }

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

// Ajout d'adresses MAC aux utilisateurs
router.post('/user/:userId/macs', async (req: Request, res: Response) => {
    const { userId } = req.params;

    const { MACs } = req.body;

    if (!Array.isArray(MACs) || MACs.some(mac => typeof mac !== 'string')) {
        return res.status(400).json({
            success: false,
            message: 'the list of MACs must be an array of strings'
        });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'User does not exist'
        })
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { MACAddresses: { $each: MACs } } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'MAC addresses added successfully',
            data: updatedUser
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: 'Error deleting data',
        })
    }
})

// suppression d'une ou plusieurs adresses MAC d'un utilisateur
router.delete('/user/:userId/macs', async (req: Request, res: Response) => {
    const { userId } = req.params;

    const { MACs } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { MACAddresses: { $each: MACs } } },
      { new: true }
    )

    if (!updatedUser) {
        return res.status(400).json({
            success: false,
            message: 'User does not exist'
        })
    }

    res.status(200).json({
        success: true,
        message: 'MAC deleted successfully',
        data: updatedUser
    })
})

// retourner tous les sensors d'un utilisateur
router.get('/user/:userId/sensors', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User does not exist'
            });
        }

        const MACs = user.MACAddresses || [];

        const sensors = await SensorData.find({ MACAddress: { $in: MACs } }).sort({ timestamp: -1 });

        return res.status(200).json({
            success: true,
            count: sensors.length,
            data: sensors
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching sensor data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;

