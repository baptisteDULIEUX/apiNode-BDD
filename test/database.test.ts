import { describe, it, expect, afterAll } from 'vitest';
import mongoose from 'mongoose';
import connectDB from '../src/database';

describe('Database Connection', () => {
    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should connect to MongoDB successfully', async () => {
        await connectDB();

        expect(mongoose.connection.readyState).toBe(1); // 1 = connected
        expect(mongoose.connection.name).toBeDefined();
    });

    it('should have a valid connection object', () => {
        expect(mongoose.connection).toBeDefined();
        expect(mongoose.connection.host).toBeDefined();
    });
});

