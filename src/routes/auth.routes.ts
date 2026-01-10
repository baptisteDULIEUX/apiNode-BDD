import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate } from '../middleware/auth.middleware';
import { 
    AuthRequest, 
    RegisterBody, 
    LoginBody, 
    AuthResponse, 
    UserResponse 
} from '../types/auth.types';

const router = Router();

// Générer un token JWT
const generateToken = (userId: string): string => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
    }
    
    return jwt.sign({ userId }, jwtSecret, {
        expiresIn: '7d', // Token valide 7 jours
    });
};

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    try {
        const { email, password, name } = req.body;

        // Validation des champs
        if (!email || !password || !name) {
            res.status(400).json({ 
                error: 'Validation error',
                message: 'Email, password and name are required' 
            });
            return;
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ 
                error: 'Conflict',
                message: 'Email already registered' 
            });
            return;
        }

        // Créer le nouvel utilisateur (le password sera hashé automatiquement)
        const user = await User.create({
            email,
            password,
            name,
        });

        // Générer le token JWT
        const token = generateToken(user._id.toString());

        // Réponse
        const response: AuthResponse = {
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
            },
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Error creating user' 
        });
    }
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validation des champs
        if (!email || !password) {
            res.status(400).json({ 
                error: 'Validation error',
                message: 'Email and password are required' 
            });
            return;
        }

        // Trouver l'utilisateur et inclure le password (normalement exclu)
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            res.status(401).json({ 
                error: 'Authentication failed',
                message: 'Invalid email or password' 
            });
            return;
        }

        // Vérifier le password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            res.status(401).json({ 
                error: 'Authentication failed',
                message: 'Invalid email or password' 
            });
            return;
        }

        // Générer le token JWT
        const token = generateToken(user._id.toString());

        // Réponse
        const response: AuthResponse = {
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Error during login' 
        });
    }
});

/**
 * GET /api/auth/me
 * Obtenir les informations de l'utilisateur connecté (route protégée)
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ 
                error: 'Authentication failed',
                message: 'User not authenticated' 
            });
            return;
        }

        const userResponse: UserResponse = {
            id: req.user._id.toString(),
            email: req.user.email,
            name: req.user.name,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt,
        };

        res.status(200).json(userResponse);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'Error fetching user data' 
        });
    }
});

export default router;
