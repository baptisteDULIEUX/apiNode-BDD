import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

describe('Database Connection', () => {
    it('should be connected to MongoDB', () => {
        expect(mongoose.connection.readyState).toBe(1); // 1 = connected
        expect(mongoose.connection.name).toBeDefined();
    });

    it('should have a valid connection object', () => {
        expect(mongoose.connection).toBeDefined();
        expect(mongoose.connection.host).toBeDefined();
    });
});

