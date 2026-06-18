import express from 'express';
import User from '../models/User';
import Sensor from '../models/Sensor';
import SessionData from '../models/SessionData';
import PhoneTestResult from '../models/PhoneTestResult';
import {
    buildFakeUser,
    buildFakeSensor,
    buildOrphanSensor,
    buildTemporalizedSession,
    buildFakePhoneTestResult,
} from '../factories';

const router = express.Router();

// Créneaux horaires avec profils physiologiques réalistes
const TIME_SLOTS = [
    { hour: 7,  minute: 30, bpmBase: 65,  tempBase: 36.4, label: 'matin'        }, // Réveil / repos
    { hour: 12, minute: 0,  bpmBase: 82,  tempBase: 36.9, label: 'midi'         }, // Activité midday
    { hour: 17, minute: 30, bpmBase: 90,  tempBase: 37.0, label: 'après-midi'   }, // Sport / pic d'activité
    { hour: 21, minute: 0,  bpmBase: 70,  tempBase: 36.7, label: 'soir'         }, // Repos soir
];

function buildTimestamp(daysAgo: number, hour: number, minute: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute + Math.floor(Math.random() * 10), 0, 0);
    return d;
}

// POST /api/seed/generate
router.post('/generate', async (req, res) => {
    try {
        const userCount  = parseInt(req.query.users    as string) || 2;
        const days       = parseInt(req.query.days     as string) || 14;
        const orphans    = parseInt(req.query.orphans  as string) || 3;

        if (req.query.clear === 'true') {
            await Promise.all([
                User.deleteMany({}),
                Sensor.deleteMany({}),
                SessionData.deleteMany({}),
                PhoneTestResult.deleteMany({}),
            ]);
        }

        const summary = {
            usersCreated: 0,
            sensorsCreated: 0,
            sessionsCreated: 0,
            phoneTestsCreated: 0,
            orphanSensorsCreated: 0,
        };

        for (let i = 0; i < userCount; i++) {
            const fakeUser = buildFakeUser();
            const fakeSensor = buildFakeSensor(fakeUser._id as any);
            fakeUser.sensors.push(fakeSensor._id as any);
            await fakeUser.save();
            await fakeSensor.save();
            summary.usersCreated++;
            summary.sensorsCreated++;

            // Sessions temporalisées : 4 créneaux × N jours
            for (let d = days; d >= 0; d--) {
                for (const slot of TIME_SLOTS) {
                    const ts = buildTimestamp(d, slot.hour, slot.minute);
                    const session = buildTemporalizedSession(
                        fakeSensor._id as any,
                        ts,
                        slot.bpmBase,
                        slot.tempBase
                    );
                    await session.save();
                    summary.sessionsCreated++;
                }
            }

            // Tests mobiles temporalisés : 1 par jour (alternance reaction / audio)
            for (let d = days; d >= 0; d--) {
                const ts = buildTimestamp(d, 9, 0); // Test du matin
                const test = buildFakePhoneTestResult(fakeUser._id as any, ts);
                await test.save();
                summary.phoneTestsCreated++;
            }
        }

        // Capteurs orphelins (non reliés à un utilisateur — pour la démo)
        for (let o = 0; o < orphans; o++) {
            const orphan = buildOrphanSensor(o);
            await orphan.save();
            summary.orphanSensorsCreated++;
            summary.sensorsCreated++;
        }

        res.status(201).json({ message: 'Seeding temporalisé réussi', summary });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors du seeding', error });
    }
});

// POST /api/seed/admin — crée un compte admin par défaut (si inexistant)
router.post('/admin', async (_req, res) => {
    try {
        const existing = await User.findOne({ email: 'admin@samsoul.fr' });
        if (existing) {
            res.status(200).json({ message: 'Compte admin déjà existant', email: 'admin@samsoul.fr' });
            return;
        }
        const admin = await User.create({
            name: 'Administrateur',
            email: 'admin@samsoul.fr',
            password: 'Admin123!',
            role: 'admin',
        });
        res.status(201).json({
            message: 'Compte admin créé',
            credentials: { email: admin.email, password: 'Admin123!' },
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur création admin', error });
    }
});

export default router;
