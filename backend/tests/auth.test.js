const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');

// We need to create a mini express app to test the routes
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Endpoints', () => {

    // Test for successful user registration
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

        // Check the response
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.username).toBe('testuser');

        // Check if the user was actually created in the test database
        const user = await User.findOne({ email: 'test@example.com' });
        expect(user).not.toBeNull();
    });

    // Test for registration with an existing email
    it('should fail to register a user with an existing email', async () => {
        // First, create a user to make the email exist
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser1',
                email: 'test1@example.com',
                password: 'password123'
            });

        // Now, try to register again with the same email
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser2',
                email: 'test1@example.com', // Same email
                password: 'password456'
            });

        // Check the response
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('User with that username or email already exists');
    });

});