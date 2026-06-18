import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Sensor from '../models/Sensor';
import SessionData from '../models/SessionData';
import PhoneTestResult from '../models/PhoneTestResult';
import { 
    buildFakeUser, 
    buildFakeSensor, 
    buildFakeSessionData, 
    buildFakePhoneTestResult 
} from '../factories';

const router = express.Router();

// --- ROUTE DE SEEDING ---
// Génère un jeu de données complet et le sauvegarde en BDD.

router.post('/generate', async (req, res) => {
    try {
        const userCount = parseInt(req.query.users as string) || 2;
        const sessionsPerUser = parseInt(req.query.sessions as string) || 3;
        const testsPerUser = parseInt(req.query.tests as string) || 4;
        
        // Optionnel : on peut vider la base avant (attention à ne pas le faire en prod)
        if (req.query.clear === 'true') {
            await Promise.all([
                User.deleteMany({}),
                Sensor.deleteMany({}),
                SessionData.deleteMany({}),
                PhoneTestResult.deleteMany({})
            ]);
        }

        const createdData = {
            users: [] as any[],
            sensors: [] as any[],
            sessions: [] as any[],
            phoneTests: [] as any[]
        };

        for (let i = 0; i < userCount; i++) {
            // 1. Créer Utilisateur
            const fakeUser = buildFakeUser();
            
            // Compte de test (connu) pour faciliter les tests front
            if (i === 0) {
                fakeUser.name = 'Utilisateur Test';
                fakeUser.email = 'test@test.com';
                // Le mot de passe par défaut est 'password123' via buildFakeUser
            }

            // 2. Créer 1 Capteur pour cet utilisateur
            const fakeSensor = buildFakeSensor(fakeUser._id as mongoose.Types.ObjectId);
            fakeUser.sensors.push(fakeSensor._id as mongoose.Types.ObjectId);
            
            await fakeUser.save();
            await fakeSensor.save();

            createdData.users.push(fakeUser);
            createdData.sensors.push(fakeSensor);

            // 3. Créer des Sessions pour ce capteur
            for (let j = 0; j < sessionsPerUser; j++) {
                const fakeSession = buildFakeSessionData(fakeSensor._id as mongoose.Types.ObjectId);
                await fakeSession.save();
                createdData.sessions.push(fakeSession);
            }

            // 4. Créer des tests téléphone pour cet utilisateur
            for (let k = 0; k < testsPerUser; k++) {
                const fakePhoneTest = buildFakePhoneTestResult(fakeUser._id as mongoose.Types.ObjectId);
                await fakePhoneTest.save();
                createdData.phoneTests.push(fakePhoneTest);
            }
        }

        res.status(201).json({
            message: "Base de données seedée avec succès avec des données crédibles",
            summary: {
                usersCreated: createdData.users.length,
                sensorsCreated: createdData.sensors.length,
                sessionsCreated: createdData.sessions.length,
                phoneTestsCreated: createdData.phoneTests.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors du seeding", error });
    }
});

export default router;
