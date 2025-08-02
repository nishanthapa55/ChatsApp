const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const messageRoutes = require('../routes/messageRoutes');
const User = require('../models/User');
const Message = require('../models/Message');

// Setup a mini express app to test the routes
const app = express();
app.use(express.json());
// This middleware mimics our 'protect' middleware for testing
app.use(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Let the real middleware handle invalid tokens if needed
        }
    }
    next();
});
app.use('/api/messages', messageRoutes);


describe('Message API Endpoints', () => {

    let userOne, userTwo, tokenOne;

    // Before each test, create two users and a token for userOne
    beforeEach(async () => {
        userOne = new User({ username: 'userOne', email: 'one@test.com', password: 'password' });
        userTwo = new User({ username: 'userTwo', email: 'two@test.com', password: 'password' });
        await userOne.save();
        await userTwo.save();

        tokenOne = jwt.sign({ id: userOne._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    });

    describe('GET /api/messages/:receiverId', () => {

        it('should return 401 if user is not authenticated', async () => {
            const res = await request(app).get(`/api/messages/${userTwo._id}`);
            expect(res.statusCode).toEqual(401);
        });

        it('should fetch messages between two users for an authenticated user', async () => {
            // Create some messages to fetch
            await Message.create({ sender: userOne._id, receiver: userTwo._id, content: 'Hello from user one' });
            await Message.create({ sender: userTwo._id, receiver: userOne._id, content: 'Hello from user two' });
            
            const res = await request(app)
                .get(`/api/messages/${userTwo._id}`)
                .set('Authorization', `Bearer ${tokenOne}`);
            
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].content).toBe('Hello from user one');
        });

        it('should return an empty array if there are no messages', async () => {
            const res = await request(app)
                .get(`/api/messages/${userTwo._id}`)
                .set('Authorization', `Bearer ${tokenOne}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);
        });
    });
});