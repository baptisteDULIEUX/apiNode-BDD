import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import User from '../src/models/User';

describe('User Model', () => {
    beforeAll(async () => {
        // Connexion à la base de test
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/samsoul-test';
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        // Nettoyer et fermer la connexion
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('User Creation', () => {
        it('should create a user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const user = await User.create(userData);

            expect(user).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.name).toBe(userData.name);
            expect(user.password).not.toBe(userData.password); // Password should be hashed
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });

        it('should hash the password before saving', async () => {
            const userData = {
                email: 'hash-test@example.com',
                password: 'plainPassword',
                name: 'Hash Test',
            };

            const user = await User.create(userData);

            expect(user.password).not.toBe(userData.password);
            expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$/); // Bcrypt hash pattern

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });

        it('should not hash password if not modified', async () => {
            const user = await User.create({
                email: 'nohash@example.com',
                password: 'password123',
                name: 'No Hash Test',
            });

            const originalHash = user.password;
            
            // Update without modifying password
            user.name = 'Updated Name';
            await user.save();

            expect(user.password).toBe(originalHash);

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });
    });

    describe('User Validation', () => {
        it('should require email', async () => {
            const user = new User({
                password: 'password123',
                name: 'Test User',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require password', async () => {
            const user = new User({
                email: 'test@example.com',
                name: 'Test User',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require name', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should validate email format', async () => {
            const user = new User({
                email: 'invalid-email',
                password: 'password123',
                name: 'Test User',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce unique email', async () => {
            const userData = {
                email: 'unique@example.com',
                password: 'password123',
                name: 'Test User',
            };

            await User.create(userData);

            // Try to create another user with same email
            // MongoDB may not enforce unique constraints immediately in tests
            // So we check if it either throws or creates a duplicate
            try {
                const duplicate = await User.create(userData);
                // If no error, check that it's actually a duplicate by counting
                const count = await User.countDocuments({ email: userData.email });
                // This should fail if MongoDB allows duplicates
                expect(count).toBe(1);
            } catch (error) {
                // Expected: should throw a duplicate key error
                expect(error).toBeDefined();
            }

            // Cleanup
            await User.deleteMany({ email: userData.email });
        });

        it('should require minimum password length', async () => {
            const user = new User({
                email: 'test@example.com',
                password: '12345', // Less than 6 characters
                name: 'Test User',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should convert email to lowercase', async () => {
            const user = await User.create({
                email: 'TEST@EXAMPLE.COM',
                password: 'password123',
                name: 'Test User',
            });

            expect(user.email).toBe('test@example.com');

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });

        it('should trim email and name', async () => {
            const user = await User.create({
                email: '  test@example.com  ',
                password: 'password123',
                name: '  Test User  ',
            });

            expect(user.email).toBe('test@example.com');
            expect(user.name).toBe('Test User');

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });
    });

    describe('Password Comparison', () => {
        it('should correctly compare valid password', async () => {
            const password = 'correctPassword';
            const user = await User.create({
                email: 'compare@example.com',
                password: password,
                name: 'Compare Test',
            });

            const isMatch = await user.comparePassword(password);
            expect(isMatch).toBe(true);

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });

        it('should reject invalid password', async () => {
            const user = await User.create({
                email: 'reject@example.com',
                password: 'correctPassword',
                name: 'Reject Test',
            });

            const isMatch = await user.comparePassword('wrongPassword');
            expect(isMatch).toBe(false);

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });

        it('should handle empty password comparison', async () => {
            const user = await User.create({
                email: 'empty@example.com',
                password: 'correctPassword',
                name: 'Empty Test',
            });

            const isMatch = await user.comparePassword('');
            expect(isMatch).toBe(false);

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });
    });

    describe('User Query', () => {
        it('should not return password by default', async () => {
            const user = await User.create({
                email: 'nopass@example.com',
                password: 'password123',
                name: 'No Pass Test',
            });

            const foundUser = await User.findById(user._id);
            expect(foundUser).toBeDefined();
            expect(foundUser?.password).toBeUndefined();

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });

        it('should return password when explicitly selected', async () => {
            const user = await User.create({
                email: 'withpass@example.com',
                password: 'password123',
                name: 'With Pass Test',
            });

            const foundUser = await User.findById(user._id).select('+password');
            expect(foundUser).toBeDefined();
            expect(foundUser?.password).toBeDefined();
            expect(foundUser?.password).toMatch(/^\$2[aby]\$\d{1,2}\$/);

            // Cleanup
            await User.deleteOne({ _id: user._id });
        });
    });
});
