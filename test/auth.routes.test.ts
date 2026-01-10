import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index';
import User from '../src/models/User';

describe('Auth Routes', () => {
    let authToken: string;
    let testUserId: string;

    beforeAll(async () => {
        // Connexion à la base de test
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/samsoul-test';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
        }
    });

    beforeEach(async () => {
        // Nettoyer la base avant chaque test
        await User.deleteMany({});
    });

    afterAll(async () => {
        // Nettoyer et fermer
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.name).toBe(userData.name);
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user).not.toHaveProperty('password');

            // Verify user was created in database
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeDefined();
        });

        it('should return 400 if email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    password: 'password123',
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('required');
        });

        it('should return 400 if password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('required');
        });

        it('should return 400 if name is missing', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('required');
        });

        it('should return 409 if email already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Existing User',
            };

            // Create first user
            await User.create(userData);

            // Try to register with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('already registered');
        });

        it('should hash the password', async () => {
            const userData = {
                email: 'hash@example.com',
                password: 'plainPassword',
                name: 'Hash User',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            const user = await User.findOne({ email: userData.email }).select('+password');
            expect(user?.password).not.toBe(userData.password);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user before each login test
            await User.create({
                email: 'login@example.com',
                password: 'password123',
                name: 'Login User',
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123',
                })
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('login@example.com');
            expect(response.body.user).not.toHaveProperty('password');

            authToken = response.body.token;
        });

        it('should return 400 if email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'password123',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('required');
        });

        it('should return 400 if password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('required');
        });

        it('should return 401 with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('Invalid email or password');
        });

        it('should return 401 with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('Invalid email or password');
        });

        it('should be case-insensitive for email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'LOGIN@EXAMPLE.COM',
                    password: 'password123',
                })
                .expect(200);

            expect(response.body).toHaveProperty('token');
        });
    });

    describe('GET /api/auth/me', () => {
        beforeEach(async () => {
            // Create a test user and get token
            const user = await User.create({
                email: 'me@example.com',
                password: 'password123',
                name: 'Me User',
            });

            testUserId = user._id.toString();

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'me@example.com',
                    password: 'password123',
                });

            authToken = loginResponse.body.token;
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('email', 'me@example.com');
            expect(response.body).toHaveProperty('name', 'Me User');
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).toHaveProperty('updatedAt');
            expect(response.body).not.toHaveProperty('password');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('No token provided');
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('Invalid token');
        });

        it('should return 401 with malformed Authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'InvalidFormat token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('No token provided');
        });

        it('should return 401 if user no longer exists', async () => {
            // Delete the user
            await User.deleteOne({ _id: testUserId });

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.message).toContain('User not found');
        });
    });

    describe('Token Validation', () => {
        it('should generate different tokens for different users', async () => {
            const user1 = {
                email: 'user1@example.com',
                password: 'password123',
                name: 'User 1',
            };

            const user2 = {
                email: 'user2@example.com',
                password: 'password123',
                name: 'User 2',
            };

            const response1 = await request(app)
                .post('/api/auth/register')
                .send(user1);

            const response2 = await request(app)
                .post('/api/auth/register')
                .send(user2);

            expect(response1.body.token).not.toBe(response2.body.token);
        });

        it('should generate new token on each login', async () => {
            await User.create({
                email: 'tokentest@example.com',
                password: 'password123',
                name: 'Token Test',
            });

            const response1 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'tokentest@example.com',
                    password: 'password123',
                });

            // Wait a bit to ensure different iat (issued at) timestamp
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const response2 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'tokentest@example.com',
                    password: 'password123',
                });

            // Tokens should be different (they contain timestamps)
            expect(response1.body.token).not.toBe(response2.body.token);
        });
    });

    describe('Integration Tests', () => {
        it('should allow full user journey: register -> login -> get profile', async () => {
            // 1. Register
            const registerData = {
                email: 'journey@example.com',
                password: 'password123',
                name: 'Journey User',
            };

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(registerData)
                .expect(201);

            const registerToken = registerResponse.body.token;

            // 2. Get profile with register token
            const profileResponse1 = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${registerToken}`)
                .expect(200);

            expect(profileResponse1.body.email).toBe(registerData.email);

            // 3. Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: registerData.email,
                    password: registerData.password,
                })
                .expect(200);

            const loginToken = loginResponse.body.token;

            // 4. Get profile with login token
            const profileResponse2 = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${loginToken}`)
                .expect(200);

            expect(profileResponse2.body.email).toBe(registerData.email);
            expect(profileResponse2.body.id).toBe(profileResponse1.body.id);
        });
    });
});
