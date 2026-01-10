import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/samsoul-test';
        console.log('🔗 Attempting MongoDB connection to:', mongoURI);

        // Fermer toute connexion existante
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected for tests');
    } catch (error) {
        console.error('❌ MongoDB connection error in tests:', error);
        throw error;
    }
});

afterAll(async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('MongoDB disconnected after tests');
        }
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
});

