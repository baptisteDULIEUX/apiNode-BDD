import express, { Request, Response } from 'express';
import Sensor from '../models/Sensor';

const router = express.Router();

// Mise à jour de la configuration d'un capteur (ex: fréquence d'échantillonnage)
router.put('/:macAddress/config', async (req: Request, res: Response) => {
    try {
        const { macAddress } = req.params;
        const { samplingFrequencyHz } = req.body;

        if (samplingFrequencyHz === undefined) {
            return res.status(400).json({
                success: false,
                message: 'samplingFrequencyHz is required'
            });
        }

        // Met à jour ou crée le capteur s'il n'existe pas encore
        const sensor = await Sensor.findOneAndUpdate(
            { MACAddress: macAddress },
            { samplingFrequencyHz },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Sensor configuration updated successfully',
            data: sensor
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating sensor config',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Récupération de la configuration d'un capteur
router.get('/:macAddress/config', async (req: Request, res: Response) => {
    try {
        const { macAddress } = req.params;
        const sensor = await Sensor.findOne({ MACAddress: macAddress });

        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensor not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                samplingFrequencyHz: sensor.samplingFrequencyHz
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching sensor config',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
