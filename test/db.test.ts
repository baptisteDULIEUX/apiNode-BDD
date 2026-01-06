import request from 'supertest';
import app from '../src/index';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import SensorData from '../src/models/SensorData';

describe('Database Routes', () => {
    const testUserId = 'test-user-123';
    let createdDataId: string;

    beforeAll(async () => {
        // Attendre que la connexion DB soit établie
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Nettoyer les données de test existantes
        await SensorData.deleteMany({ userId: testUserId });
    });

    afterAll(async () => {
        // Nettoyer après les tests
        await SensorData.deleteMany({ userId: testUserId });
        await mongoose.connection.close();
    });

    describe('POST /api/db/store', () => {
        it('should store sensor data successfully', async () => {
            const sensorData = {
                userId: testUserId,
                accelerometer1: { x: 1.5, y: 2.3, z: 0.8 },
                accelerometer2: { x: 1.2, y: 2.1, z: 0.9 },
                heartRate: { bpm: 75, variance: 5 },
                temperature: { celsius: 36.5, fahrenheit: 97.7 },
                reactionTimes: [250, 280, 260, 275],
                userData: { age: 25, weight: 70, height: 175 }
            };

            const res = await request(app)
                .post('/api/db/store')
                .send(sensorData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Data stored successfully');
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.userId).toBe(testUserId);

            createdDataId = res.body.data._id;
        });

        it('should store data with minimal fields', async () => {
            const minimalData = {
                userId: testUserId,
                heartRate: { bpm: 80 }
            };

            const res = await request(app)
                .post('/api/db/store')
                .send(minimalData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should handle missing userId', async () => {
            const invalidData = {
                heartRate: { bpm: 80 }
            };

            const res = await request(app)
                .post('/api/db/store')
                .send(invalidData);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/db/user/:userId', () => {
        it('should retrieve all user data', async () => {
            const res = await request(app)
                .get(`/api/db/user/${testUserId}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBeGreaterThan(0);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data[0].userId).toBe(testUserId);
        });

        it('should respect limit and skip parameters', async () => {
            const res = await request(app)
                .get(`/api/db/user/${testUserId}`)
                .query({ limit: 1, skip: 0 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeLessThanOrEqual(1);
        });

        it('should return empty array for non-existent user', async () => {
            const res = await request(app)
                .get('/api/db/user/non-existent-user');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(0);
            expect(res.body.data).toEqual([]);
        });
    });

    describe('GET /api/db/user/:userId/latest', () => {
        it('should retrieve latest user data', async () => {
            const res = await request(app)
                .get(`/api/db/user/${testUserId}/latest`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.userId).toBe(testUserId);
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .get('/api/db/user/non-existent-user/latest');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No data found for this user');
        });
    });

    describe('GET /api/db/user/:userId/range', () => {
        it('should retrieve data by date range', async () => {
            const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const endDate = new Date().toISOString();

            const res = await request(app)
                .get(`/api/db/user/${testUserId}/range`)
                .query({ startDate, endDate });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should retrieve data with only startDate', async () => {
            const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const res = await request(app)
                .get(`/api/db/user/${testUserId}/range`)
                .query({ startDate });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should retrieve all data without date filters', async () => {
            const res = await request(app)
                .get(`/api/db/user/${testUserId}/range`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBeGreaterThan(0);
        });
    });

    describe('DELETE /api/db/user/:userId', () => {
        it('should delete all user data', async () => {
            // D'abord créer des données à supprimer
            const tempUserId = 'temp-user-to-delete';
            await request(app)
                .post('/api/db/store')
                .send({
                    userId: tempUserId,
                    heartRate: { bpm: 70 }
                });

            const res = await request(app)
                .delete(`/api/db/user/${tempUserId}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Data deleted successfully');
            expect(res.body.deletedCount).toBeGreaterThan(0);

            // Vérifier que les données ont été supprimées
            const checkRes = await request(app)
                .get(`/api/db/user/${tempUserId}`);
            expect(checkRes.body.count).toBe(0);
        });

        it('should return 0 deletedCount for non-existent user', async () => {
            const res = await request(app)
                .delete('/api/db/user/non-existent-user');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.deletedCount).toBe(0);
        });
    });
});

