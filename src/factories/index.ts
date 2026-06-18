import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import User from '../models/User';
import Sensor from '../models/Sensor';
import SessionData from '../models/SessionData';
import PhoneTestResult from '../models/PhoneTestResult';

const PASSWORDS = 'password123';

export const buildFakeUser = () => {
    return new User({
        _id: new mongoose.Types.ObjectId(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: PASSWORDS,
        sensors: []
    });
};

export const buildFakeSensor = (userId: mongoose.Types.ObjectId) => {
    return new Sensor({
        _id: new mongoose.Types.ObjectId(),
        MACAddress: faker.internet.mac().toUpperCase(),
        user: userId,
        name: `Capteur de ${faker.person.firstName()}`,
        samplingFrequencyHz: faker.helpers.arrayElement([50, 100, 200])
    });
};

export const buildOrphanSensor = (index: number) => {
    return new Sensor({
        _id: new mongoose.Types.ObjectId(),
        MACAddress: faker.internet.mac().toUpperCase(),
        name: `Capteur Démo ${index + 1}`,
        samplingFrequencyHz: 50,
    });
};

/**
 * Génère une session avec timestamp et valeurs physiologiques contrôlés.
 * bpmBase et tempBase permettent de simuler des patterns par heure de la journée.
 */
export const buildTemporalizedSession = (
    sensorId: mongoose.Types.ObjectId,
    timestamp: Date,
    bpmBase: number,
    tempBase: number
) => {
    const bpm = Math.max(45, Math.min(180, bpmBase + faker.number.int({ min: -8, max: 8 })));
    const temp = parseFloat((tempBase + faker.number.float({ min: -0.15, max: 0.15, fractionDigits: 2 })).toFixed(1));

    const acc1 = new Map([
        ["x", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["y", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["z", faker.number.float({ min: 8, max: 11, fractionDigits: 2 })],
    ]);
    const acc2 = new Map([
        ["x", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["y", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["z", faker.number.float({ min: 8, max: 11, fractionDigits: 2 })],
    ]);

    return new SessionData({
        _id: new mongoose.Types.ObjectId(),
        sensor: sensorId,
        sessionTimestamp: timestamp,
        accelerometer1: acc1,
        accelerometer2: acc2,
        heartRate: new Map([["bpm", bpm]]),
        temperature: new Map([["celsius", temp]]),
        reactionTimes: Array.from({ length: 5 }, () =>
            faker.number.int({ min: 180, max: 400 })
        ),
        userData: new Map([
            ["activity", faker.helpers.arrayElement(["repos", "marche", "course"])],
            ["feeling", faker.helpers.arrayElement(["bien", "fatigué", "stressé"])],
        ]),
    });
};

// Conservé pour compatibilité
export const buildFakeSessionData = (sensorId: mongoose.Types.ObjectId) => {
    return buildTemporalizedSession(
        sensorId,
        faker.date.recent({ days: 30 }),
        faker.number.int({ min: 60, max: 120 }),
        faker.number.float({ min: 36.1, max: 37.8, fractionDigits: 1 })
    );
};

export const buildFakePhoneTestResult = (userId: mongoose.Types.ObjectId, timestamp?: Date) => {
    const testType = faker.helpers.arrayElement(['REACTION_TIME', 'AUDIO_ANALYSIS'] as const);
    const isIntoxicated = faker.datatype.boolean(0.3);

    let results: any;
    if (testType === 'REACTION_TIME') {
        const times = Array.from({ length: 5 }, () =>
            faker.number.int({ min: isIntoxicated ? 250 : 150, max: isIntoxicated ? 500 : 300 })
        );
        results = { times, average: times.reduce((a, b) => a + b, 0) / times.length };
    } else {
        results = {
            duration: faker.number.float({ min: 2, max: 10, fractionDigits: 2 }),
            pitchMean: faker.number.float({ min: 80, max: 250, fractionDigits: 2 }),
            pitchStdDev: faker.number.float({ min: 5, max: 30, fractionDigits: 2 }),
            rmsMean: faker.number.float({ min: 0.001, max: 0.05, fractionDigits: 3 }),
            mfccMean: Array.from({ length: 13 }, () =>
                faker.number.float({ min: -100, max: 100, fractionDigits: 2 })
            ),
        };
    }

    return new PhoneTestResult({
        _id: new mongoose.Types.ObjectId(),
        userId,
        testType,
        intoxicationStatus: isIntoxicated ? 'Intoxiqué' : 'Sobre',
        intoxicationScore: faker.number.float({
            min: isIntoxicated ? 0.5 : 0,
            max: isIntoxicated ? 1 : 0.4,
            fractionDigits: 4,
        }),
        timestamp: timestamp ?? faker.date.recent({ days: 30 }),
        results,
    });
};
