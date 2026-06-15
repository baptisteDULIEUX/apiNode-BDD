import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import SessionData from '../src/models/SessionData';
import Sensor from '../src/models/Sensor';

describe('Models (Sensor and SessionData)', () => {

    const testMacAddress = '00:11:22:33:44:55';
    let sensorId: mongoose.Types.ObjectId;

    beforeAll(async () => {
        // Préparer un capteur pour les tests
        const sensor = new Sensor({ MACAddress: testMacAddress });
        const savedSensor = await sensor.save();
        sensorId = savedSensor._id as mongoose.Types.ObjectId;
    });

    afterAll(async () => {
        // Nettoyage
        await SessionData.deleteMany({ sensor: sensorId });
        await Sensor.deleteMany({ MACAddress: testMacAddress });
    });

    it('should create a sensor document with MAC address', async () => {
        const sensor = await Sensor.findOne({ MACAddress: testMacAddress });
        expect(sensor).toBeDefined();
        expect(sensor?.MACAddress).toBe(testMacAddress);
    });

    it('should fail to create sensor without MACAddress', async () => {
        const sensor = new Sensor({});
        await expect(sensor.save()).rejects.toThrow();
    });

    it('should create a session data document with all fields', async () => {
        const sessionData = new SessionData({
            sensor: sensorId,
            accelerometer1: new Map([['x', 1.5], ['y', 2.3], ['z', 0.8]]),
            accelerometer2: new Map([['x', 1.2], ['y', 2.1], ['z', 0.9]]),
            heartRate: new Map([['bpm', 75], ['variance', 5]]),
            temperature: new Map([['celsius', 36.5]]),
            reactionTimes: [250, 280, 260],
            userData: new Map([['age', 25], ['weight', 70]])
        });

        const saved = await sessionData.save();

        expect(saved._id).toBeDefined();
        expect(saved.sensor.toString()).toBe(sensorId.toString());
        expect(saved.sessionTimestamp).toBeDefined();
        expect(saved.accelerometer1.get('x')).toBe(1.5);
        expect(saved.heartRate.get('bpm')).toBe(75);
        expect(saved.reactionTimes).toEqual([250, 280, 260]);
    });

    it('should create a session data document with minimal fields', async () => {
        const sessionData = new SessionData({
            sensor: sensorId
        });

        const saved = await sessionData.save();

        expect(saved._id).toBeDefined();
        expect(saved.sensor.toString()).toBe(sensorId.toString());
        expect(saved.sessionTimestamp).toBeDefined();
    });

    it('should fail without sensor reference', async () => {
        const sessionData = new SessionData({});

        await expect(sessionData.save()).rejects.toThrow();
    });

    it('should have sessionTimestamp set automatically', async () => {
        const before = new Date();

        const sessionData = new SessionData({
            sensor: sensorId
        });

        const saved = await sessionData.save();
        const after = new Date();

        expect(saved.sessionTimestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(saved.sessionTimestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should allow Map types for session data', async () => {
        const sessionData = new SessionData({
            sensor: sensorId,
            accelerometer1: new Map([['custom', 999]])
        });

        const saved = await sessionData.save();

        expect(saved.accelerometer1.get('custom')).toBe(999);
    });

    it('should find session data by sensor', async () => {
        const data = await SessionData.find({ sensor: sensorId });

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0].sensor.toString()).toBe(sensorId.toString());
    });

    it('should sort by sessionTimestamp descending', async () => {
        // Créer deux documents avec un délai
        await new SessionData({ sensor: sensorId }).save();
        await new Promise(resolve => setTimeout(resolve, 100));
        await new SessionData({ sensor: sensorId }).save();

        const data = await SessionData.find({ sensor: sensorId })
            .sort({ sessionTimestamp: -1 });

        expect(data.length).toBeGreaterThanOrEqual(2);
        expect(data[0].sessionTimestamp.getTime()).toBeGreaterThanOrEqual(data[1].sessionTimestamp.getTime());
    });
});
