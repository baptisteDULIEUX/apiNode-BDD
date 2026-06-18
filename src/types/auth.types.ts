import { Request } from 'express';
import { IUser } from '../models/User';

// Extension de Request pour inclure l'utilisateur authentifié
export interface AuthRequest extends Request {
    user?: IUser;
}

// Types pour les requêtes d'authentification
export interface RegisterBody {
    email: string;
    password: string;
    name: string;
}

export interface LoginBody {
    email: string;
    password: string;
}

// Types pour les réponses d'authentification
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
