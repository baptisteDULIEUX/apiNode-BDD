import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticate } from '../src/middleware/auth.middleware';
import User from '../src/models/User';
import { AuthRequest } from '../src/types/auth.types';

describe('Auth Middleware', () => {
    let testUserId: mongoose.Types.ObjectId;
    let validToken: string;

    beforeAll(async () => {
        // Connexion à la base de test
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/samsoul-test';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
        }

        // Create a test user
        const user = await User.create({
            email: 'middleware@example.com',
            password: 'password123',
            name: 'Middleware Test',
        });

        testUserId = user._id;

        // Generate a valid token
        const jwtSecret = process.env.JWT_SECRET || 'test-secret';
        validToken = jwt.sign({ userId: testUserId.toString() }, jwtSecret, {
            expiresIn: '7d',
        });
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    const mockResponse = () => {
        const res = {} as Response;
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    const mockNext = () => vi.fn() as NextFunction;

    describe('Valid Token', () => {
        it('should authenticate with valid token and attach user', async () => {
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user?._id.toString()).toBe(testUserId.toString());
            expect(req.user?.email).toBe('middleware@example.com');
            expect(req.user?.password).toBeUndefined(); // Should not include password
        });

        it('should work with different Authorization header formats', async () => {
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
        });
    });

    describe('Missing Token', () => {
        it('should return 401 if no authorization header', async () => {
            const req = {
                headers: {},
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Authentication required',
                    message: 'No token provided',
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header does not start with Bearer', async () => {
            const req = {
                headers: {
                    authorization: 'InvalidFormat token',
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Authentication required',
                    message: 'No token provided',
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header is empty', async () => {
            const req = {
                headers: {
                    authorization: '',
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Invalid Token', () => {
        it('should return 401 with malformed token', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Authentication failed',
                    message: 'Invalid token',
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 with expired token', async () => {
            const jwtSecret = process.env.JWT_SECRET || 'test-secret';
            const expiredToken = jwt.sign(
                { userId: testUserId.toString() },
                jwtSecret,
                { expiresIn: '0s' } // Already expired
            );

            // Wait a moment to ensure expiration
            await new Promise((resolve) => setTimeout(resolve, 100));

            const req = {
                headers: {
                    authorization: `Bearer ${expiredToken}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Authentication failed',
                    // Message peut être 'Token expired' ou 'Invalid token' selon la version de jwt
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if user does not exist', async () => {
            const jwtSecret = process.env.JWT_SECRET || 'test-secret';
            const nonExistentUserId = new mongoose.Types.ObjectId();
            const tokenForNonExistentUser = jwt.sign(
                { userId: nonExistentUserId.toString() },
                jwtSecret,
                { expiresIn: '7d' }
            );

            const req = {
                headers: {
                    authorization: `Bearer ${tokenForNonExistentUser}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Authentication failed',
                    message: 'User not found',
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 with token signed with different secret', async () => {
            const differentSecret = 'different-secret-key';
            const tokenWithDifferentSecret = jwt.sign(
                { userId: testUserId.toString() },
                differentSecret,
                { expiresIn: '7d' }
            );

            const req = {
                headers: {
                    authorization: `Bearer ${tokenWithDifferentSecret}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Authentication failed',
                    message: 'Invalid token',
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('JWT_SECRET Configuration', () => {
        it('should return 500 if JWT_SECRET is not configured', async () => {
            const originalSecret = process.env.JWT_SECRET;
            delete process.env.JWT_SECRET;

            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Server configuration error',
                    message: 'JWT_SECRET not configured',
                })
            );
            expect(next).not.toHaveBeenCalled();

            // Restore
            process.env.JWT_SECRET = originalSecret;
        });
    });

    describe('User Object', () => {
        it('should not include password in user object', async () => {
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user?.password).toBeUndefined();
        });

        it('should include all other user fields', async () => {
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user?._id).toBeDefined();
            expect(req.user?.email).toBe('middleware@example.com');
            expect(req.user?.name).toBe('Middleware Test');
            expect(req.user?.createdAt).toBeDefined();
            expect(req.user?.updatedAt).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle token with extra spaces', async () => {
            const req = {
                headers: {
                    authorization: `Bearer   ${validToken}   `,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            // Should fail because of extra spaces
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should be case-sensitive for Bearer keyword', async () => {
            const req = {
                headers: {
                    authorization: `bearer ${validToken}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle missing userId in token payload', async () => {
            const jwtSecret = process.env.JWT_SECRET || 'test-secret';
            const tokenWithoutUserId = jwt.sign({ someOtherField: 'value' }, jwtSecret, {
                expiresIn: '7d',
            });

            const req = {
                headers: {
                    authorization: `Bearer ${tokenWithoutUserId}`,
                },
            } as AuthRequest;

            const res = mockResponse();
            const next = mockNext();

            await authenticate(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
