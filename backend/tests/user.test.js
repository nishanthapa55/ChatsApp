const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const userRoutes = require('../routes/userRoutes');
const User = require('../models/User');

// Setup a mini express app to test the user routes
const app = express();
app.use(express.json());

// --- THIS IS THE FIX ---
// Add a mock middleware to simulate req.io for socket events
app.use((req, res, next) => {
    req.io = { emit: jest.fn() }; // We use jest.fn() to create a mock function
    next();
});

// This middleware mimics our 'protect' middleware for testing purposes
app.use(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Error is handled by the route's real 'protect' middleware
        }
    }
    next();
});
app.use('/api/users', userRoutes);


describe('User API Endpoints', () => {

    let testUser;
    let token;

    beforeEach(async () => {
        testUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        });
        await testUser.save();
        token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    });

    describe('GET /api/users', () => {
        // ... these tests remain the same
        it('should return 401 if no token is provided', async () => { /* ... */ });
        it('should return a list of users for an authenticated user', async () => { /* ... */ });
    });
    
    describe('PUT /api/users/profile', () => {
        it('should return 401 if user is not authenticated', async () => {
            const res = await request(app)
                .put('/api/users/profile')
                .send({ firstName: 'NewName' });
            expect(res.statusCode).toEqual(401);
        });

        it('should update the user profile if authenticated', async () => {
            const updateData = {
                firstName: 'UpdatedFirst',
                lastName: 'UpdatedLast'
            };
            
            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.firstName).toBe('UpdatedFirst');
            const updatedUserInDb = await User.findById(testUser._id);
            expect(updatedUserInDb.firstName).toBe('UpdatedFirst');
        });
    });

});