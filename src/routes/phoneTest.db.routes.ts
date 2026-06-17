import express, { Request, Response } from 'express';
import User from '../models/User';
import PhoneTestResult from '../models/PhoneTestResult';

const router = express.Router();

// Récupérer toutes les données de test téléphone d'un utilisateur
router.get('/:userId/phone-tests', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { limit = 100, skip = 0 } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const data = await PhoneTestResult.find({ userId: user._id })
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
            message: 'Error retrieving phone test data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Enregistrer un nouveau test téléphone pour un utilisateur
router.post('/:userId/phone-tests', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { testType, intoxicationStatus, intoxicationScore, timestamp, results } = req.body;

        if (!testType || !results) {
            return res.status(400).json({
                success: false,
                message: 'testType and results are required fields'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newPhoneTest = new PhoneTestResult({
            userId: user._id,
            testType,
            intoxicationStatus,
            intoxicationScore,
            timestamp: timestamp || new Date(),
            results
        });

        await newPhoneTest.save();

        res.status(201).json({
            success: true,
            message: 'Phone test result saved successfully',
            data: newPhoneTest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saving phone test data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
