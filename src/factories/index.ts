import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import User from '../models/User';
import Sensor from '../models/Sensor';
import SessionData from '../models/SessionData';
import PhoneTestResult from '../models/PhoneTestResult';

// Configurations
const PASSWORDS = 'password123';

/**
 * Génère un faux utilisateur (sans l'enregistrer en BDD)
 */
export const buildFakeUser = () => {
    return new User({
        _id: new mongoose.Types.ObjectId(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: PASSWORDS, // Sera hashé par le hook pre-save du modèle
        sensors: []
    });
};

/**
 * Génère un faux capteur lié à un utilisateur (sans l'enregistrer en BDD)
 */
export const buildFakeSensor = (userId: mongoose.Types.ObjectId) => {
    return new Sensor({
        _id: new mongoose.Types.ObjectId(),
        MACAddress: faker.internet.mac().toUpperCase(),
        user: userId,
        name: `Capteur de ${faker.person.firstName()}`,
        samplingFrequencyHz: faker.helpers.arrayElement([50, 100, 200])
    });
};

/**
 * Génère de fausses données de session pour un capteur (sans l'enregistrer en BDD)
 */
export const buildFakeSessionData = (sensorId: mongoose.Types.ObjectId) => {
    // Génère des données de capteurs crédibles
    const acc1 = new Map([
        ["x", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["y", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["z", faker.number.float({ min: 8, max: 11, fractionDigits: 2 })] // Gravité
    ]);

    const acc2 = new Map([
        ["x", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["y", faker.number.float({ min: -2, max: 2, fractionDigits: 2 })],
        ["z", faker.number.float({ min: 8, max: 11, fractionDigits: 2 })]
    ]);

    return new SessionData({
        _id: new mongoose.Types.ObjectId(),
        sensor: sensorId,
        sessionTimestamp: faker.date.recent({ days: 30 }),
        accelerometer1: acc1,
        accelerometer2: acc2,
        heartRate: new Map([["bpm", faker.number.int({ min: 60, max: 120 })]]),
        temperature: new Map([["celsius", faker.number.float({ min: 36.1, max: 37.8, fractionDigits: 1 })]]),
        reactionTimes: Array.from({ length: 5 }, () => faker.number.int({ min: 180, max: 400 })),
        userData: new Map([
            ["activity", faker.helpers.arrayElement(["repos", "marche", "course"])],
            ["feeling", faker.helpers.arrayElement(["bien", "fatigué", "stressé"])]
        ])
    });
};

/**
 * Génère de faux résultats de test téléphone pour un utilisateur (sans l'enregistrer en BDD)
 */
export const buildFakePhoneTestResult = (userId: mongoose.Types.ObjectId) => {
    const testType = faker.helpers.arrayElement(['REACTION_TIME', 'AUDIO_ANALYSIS'] as const);
    const isIntoxicated = faker.datatype.boolean(0.3); // 30% de chance d'être intoxiqué

    let results: any;
    if (testType === 'REACTION_TIME') {
        const times = Array.from({ length: 5 }, () => faker.number.int({ min: isIntoxicated ? 250 : 150, max: isIntoxicated ? 500 : 300 }));
        results = {
            times,
            average: times.reduce((a, b) => a + b, 0) / times.length
        };
    } else {
        results = {
            duration: faker.number.float({ min: 2, max: 10, fractionDigits: 2 }),
            pitchMean: faker.number.float({ min: 80, max: 250, fractionDigits: 2 }),
            pitchStdDev: faker.number.float({ min: 5, max: 30, fractionDigits: 2 }),
            rmsMean: faker.number.float({ min: 0.001, max: 0.05, fractionDigits: 3 }),
            mfccMean: Array.from({ length: 13 }, () => faker.number.float({ min: -100, max: 100, fractionDigits: 2 }))
        };
    }

    return new PhoneTestResult({
        _id: new mongoose.Types.ObjectId(),
        userId: userId,
        testType: testType,
        intoxicationStatus: isIntoxicated ? 'Intoxiqué' : 'Sobre',
        intoxicationScore: faker.number.float({ min: isIntoxicated ? 0.5 : 0, max: isIntoxicated ? 1 : 0.4, fractionDigits: 4 }),
        timestamp: faker.date.recent({ days: 30 }),
        results
    });
};
