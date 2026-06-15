import request from 'supertest';
import app from '../src/index';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import SessionData from '../src/models/SessionData';
import Sensor from '../src/models/Sensor';
import User from '../src/models/User';

describe('Database Routes', () => {
    let testUserId: string;
    const testMacAddress = 'AA:BB:CC:DD:EE:FF';
    const testMacAddress2 = '11:22:33:44:55:66';

    beforeAll(async () => {
        // Préparer un utilisateur de test
        const user = new User({
            name: 'DB Route Test User',
            email: 'db-test-user@test.com',
            password: 'password123'
        });
        const savedUser = await user.save();
        testUserId = savedUser._id.toString();

        await SessionData.deleteMany({});
        await Sensor.deleteMany({});
    });

    afterAll(async () => {
        await SessionData.deleteMany({});
        await Sensor.deleteMany({});
        await User.findByIdAndDelete(testUserId);
    });

    describe('POST /api/db/store', () => {
        it('should store session data successfully and create an orphan sensor if new', async () => {
            const sessionData = {
                macAddress: testMacAddress,
                accelerometer1: { x: 1.5, y: 2.3, z: 0.8 },
                heartRate: { bpm: 75, variance: 5 }
            };

            const res = await request(app)
                .post('/api/db/store')
                .send(sessionData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data).toHaveProperty('sensor');

            // Verify the sensor was created
            const sensor = await Sensor.findOne({ MACAddress: testMacAddress });
            expect(sensor).toBeDefined();
            expect(sensor?.MACAddress).toBe(testMacAddress);
        });
    });

    describe('POST /api/db/user/:userId/macs', () => {
        it('should link MAC addresses to a user', async () => {
            const res = await request(app)
                .post(`/api/db/user/${testUserId}/macs`)
                .send({ MACs: [testMacAddress, testMacAddress2] });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            
            // Check that User now has sensors
            const updatedUser = await User.findById(testUserId);
            expect(updatedUser?.sensors.length).toBe(2);
        });

        it('should fail with invalid MACs format', async () => {
            const res = await request(app)
                .post(`/api/db/user/${testUserId}/macs`)
                .send({ MACs: "not-an-array" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/db/user/:userId', () => {
        it('should retrieve all session data for a user', async () => {
            // Store some data for the second MAC
            await request(app).post('/api/db/store').send({
                macAddress: testMacAddress2,
                temperature: { celsius: 36.5 }
            });

            const res = await request(app)
                .get(`/api/db/user/${testUserId}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBeGreaterThan(0);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/db/user/:userId/range', () => {
        it('should retrieve data by date range', async () => {
            const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const res = await request(app)
                .get(`/api/db/user/${testUserId}/range`)
                .query({ startDate, endDate });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/db/user/:userId/sensors', () => {
        it('should return the sensors linked to the user', async () => {
            const res = await request(app)
                .get(`/api/db/user/${testUserId}/sensors`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(2);
            expect(Array.isArray(res.body.data)).toBe(true);
            // First item should be a populated sensor object
            expect(res.body.data[0]).toHaveProperty('MACAddress');
        });
    });

    describe('DELETE /api/db/user/:userId/macs', () => {
        it('should unlink MAC addresses from a user', async () => {
            const res = await request(app)
                .delete(`/api/db/user/${testUserId}/macs`)
                .send({ MACs: [testMacAddress] });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Check that User now has only 1 sensor left
            const updatedUser = await User.findById(testUserId);
            expect(updatedUser?.sensors.length).toBe(1);
        });
    });
});
