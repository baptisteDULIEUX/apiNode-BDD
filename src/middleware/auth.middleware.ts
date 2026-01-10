import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../types/auth.types';

interface JwtPayload {
    userId: string;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Récupérer le token du header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ 
                error: 'Authentication required',
                message: 'No token provided' 
            });
            return;
        }

        const token = authHeader.substring(7); // Retirer 'Bearer '

        // Vérifier le JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ 
                error: 'Server configuration error',
                message: 'JWT_SECRET not configured' 
            });
            return;
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // Récupérer l'utilisateur depuis la DB
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            res.status(401).json({ 
                error: 'Authentication failed',
                message: 'User not found' 
            });
            return;
        }

        // Attacher l'utilisateur à la requête
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ 
                error: 'Authentication failed',
                message: 'Invalid token' 
            });
            return;
        }
        
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ 
                error: 'Authentication failed',
                message: 'Token expired' 
            });
            return;
        }

        res.status(500).json({ 
            error: 'Server error',
            message: 'Authentication error' 
        });
    }
};
