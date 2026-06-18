import { Response, NextFunction } from 'express';
import { authenticate } from './auth.middleware';
import { AuthRequest } from '../types/auth.types';

export const requireAdmin = [
    authenticate,
    (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required',
            });
            return;
        }
        next();
    },
];
