import { Router, Request, Response } from 'express';
import User from '../models/User';
import Sensor from '../models/Sensor';
import SessionData from '../models/SessionData';
import PhoneTestResult from '../models/PhoneTestResult';
import { requireAdmin } from '../middleware/admin.middleware';
import { AuthRequest } from '../types/auth.types';

const router = Router();

// GET /api/admin/users — liste tous les utilisateurs
router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password').lean();
        const sensorCounts = await Sensor.aggregate([
            { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        const countMap = new Map(
            sensorCounts
                .filter(s => s._id != null)
                .map(s => [s._id.toString(), s.count])
        );

        const result = users.map(u => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            sensorCount: countMap.get(u._id.toString()) ?? 0,
            createdAt: u.createdAt,
        }));

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error });
    }
});

// POST /api/admin/users — créer un utilisateur
router.post('/users', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, email, password, role = 'user' } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'name, email et password requis' });
            return;
        }

        const existing = await User.findOne({ email });
        if (existing) {
            res.status(409).json({ success: false, message: 'Email déjà utilisé' });
            return;
        }

        const user = await User.create({ name, email, password, role });

        res.status(201).json({
            success: true,
            data: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la création', error });
    }
});

// DELETE /api/admin/users/:id — supprimer un utilisateur et toutes ses données
router.delete('/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (req.user?._id.toString() === id) {
            res.status(400).json({ success: false, message: 'Impossible de supprimer son propre compte' });
            return;
        }

        const user = await User.findById(id);
        if (!user) {
            res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
            return;
        }

        // Délie les capteurs (conservés) et supprime les sessions + tests
        const sensors = await Sensor.find({ user: id });
        const sensorIds = sensors.map(s => s._id);
        await SessionData.deleteMany({ sensor: { $in: sensorIds } });
        await Sensor.updateMany({ user: id }, { $unset: { user: 1 } });
        await PhoneTestResult.deleteMany({ userId: id });
        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Utilisateur supprimé, capteurs conservés sans propriétaire' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression', error });
    }
});

// GET /api/admin/users/:id/sensors — capteurs d'un utilisateur spécifique
router.get('/users/:id/sensors', requireAdmin, async (req: Request, res: Response) => {
    try {
        const sensors = await Sensor.find({ user: req.params.id }).lean();
        const result = sensors.map(s => ({
            id: s._id.toString(),
            MACAddress: s.MACAddress,
            name: s.name ?? null,
            samplingFrequencyHz: s.samplingFrequencyHz ?? null,
        }));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error });
    }
});

// GET /api/admin/sensors — liste tous les capteurs
router.get('/sensors', requireAdmin, async (_req: Request, res: Response) => {
    try {
        const sensors = await Sensor.find({}).populate('user', 'name email').lean();
        const result = sensors.map(s => ({
            id: s._id.toString(),
            MACAddress: s.MACAddress,
            name: s.name ?? null,
            samplingFrequencyHz: s.samplingFrequencyHz ?? null,
            user: s.user
                ? { id: (s.user as any)._id.toString(), name: (s.user as any).name, email: (s.user as any).email }
                : null,
        }));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error });
    }
});

// DELETE /api/admin/sensors/:id — supprimer un capteur et ses sessions
router.delete('/sensors/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const sensor = await Sensor.findById(id);
        if (!sensor) {
            res.status(404).json({ success: false, message: 'Capteur introuvable' });
            return;
        }

        await SessionData.deleteMany({ sensor: id });
        await User.updateMany({ sensors: id }, { $pull: { sensors: id } });
        await Sensor.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Capteur et ses sessions supprimés' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression', error });
    }
});

export default router;
