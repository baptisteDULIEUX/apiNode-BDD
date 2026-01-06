import { describe, it, expect, afterAll } from 'vitest';
import SensorData from '../src/models/SensorData';

describe('SensorData Model', () => {

    afterAll(async () => {
        await SensorData.deleteMany({ userId: 'model-test-user' });
    });

    it('should create a sensor data document with all fields', async () => {
        const sensorData = new SensorData({
            userId: 'model-test-user',
            accelerometer1: new Map([['x', 1.5], ['y', 2.3], ['z', 0.8]]),
            accelerometer2: new Map([['x', 1.2], ['y', 2.1], ['z', 0.9]]),
            heartRate: new Map([['bpm', 75], ['variance', 5]]),
            temperature: new Map([['celsius', 36.5]]),
            reactionTimes: [250, 280, 260],
            userData: new Map([['age', 25], ['weight', 70]])
        });

        const saved = await sensorData.save();

        expect(saved._id).toBeDefined();
        expect(saved.userId).toBe('model-test-user');
        expect(saved.timestamp).toBeDefined();
        expect(saved.accelerometer1.get('x')).toBe(1.5);
        expect(saved.heartRate.get('bpm')).toBe(75);
        expect(saved.reactionTimes).toEqual([250, 280, 260]);
    });

    it('should create a sensor data document with minimal fields', async () => {
        const sensorData = new SensorData({
            userId: 'model-test-user'
        });

        const saved = await sensorData.save();

        expect(saved._id).toBeDefined();
        expect(saved.userId).toBe('model-test-user');
        expect(saved.timestamp).toBeDefined();
    });

    it('should fail without userId', async () => {
        const sensorData = new SensorData({});

        await expect(sensorData.save()).rejects.toThrow();
    });

    it('should have timestamp set automatically', async () => {
        const before = new Date();

        const sensorData = new SensorData({
            userId: 'model-test-user'
        });

        const saved = await sensorData.save();
        const after = new Date();

        expect(saved.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(saved.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should allow Map types for sensor data', async () => {
        const sensorData = new SensorData({
            userId: 'model-test-user',
            accelerometer1: new Map([['custom', 999]])
        });

        const saved = await sensorData.save();

        expect(saved.accelerometer1.get('custom')).toBe(999);
    });

    it('should find sensor data by userId', async () => {
        const data = await SensorData.find({ userId: 'model-test-user' });

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0].userId).toBe('model-test-user');
    });

    it('should sort by timestamp descending', async () => {
        // Créer deux documents avec un délai
        await new SensorData({ userId: 'model-test-user' }).save();
        await new Promise(resolve => setTimeout(resolve, 100));
        await new SensorData({ userId: 'model-test-user' }).save();

        const data = await SensorData.find({ userId: 'model-test-user' })
            .sort({ timestamp: -1 });

        expect(data.length).toBeGreaterThanOrEqual(2);
        expect(data[0].timestamp.getTime()).toBeGreaterThanOrEqual(data[1].timestamp.getTime());
    });
});
