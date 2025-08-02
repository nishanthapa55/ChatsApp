const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const groupRoutes = require('../routes/groupRoutes');
const User = require('../models/User');
const Group = require('../models/Group');

// Setup a mini express app
const app = express();
app.use(express.json());
// Mock middleware for req.io
app.use((req, res, next) => {
    req.io = { emit: jest.fn() };
    next();
});
// Mock middleware for authentication
app.use(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {}
    }
    next();
});
app.use('/api/groups', groupRoutes);

describe('Group API Endpoints', () => {
    let userOne, userTwo, userThree, tokenOne, tokenTwo;

    beforeEach(async () => {
        // Create users
        [userOne, userTwo, userThree] = await User.create([
            { username: 'userOne', email: 'one@test.com', password: 'password' },
            { username: 'userTwo', email: 'two@test.com', password: 'password' },
            { username: 'userThree', email: 'three@test.com', password: 'password' }
        ]);
        // Create tokens
        tokenOne = jwt.sign({ id: userOne._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        tokenTwo = jwt.sign({ id: userTwo._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    });

    describe('POST /api/groups', () => {
        it('should create a new group with the creator as admin and member', async () => {
            const res = await request(app)
                .post('/api/groups')
                .set('Authorization', `Bearer ${tokenOne}`)
                .send({
                    name: 'Test Group',
                    members: [userTwo._id, userThree._id]
                });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body.name).toBe('Test Group');
            expect(res.body.admin).toBe(userOne._id.toString());
            // Should contain all sent members + the creator
            expect(res.body.members).toHaveLength(3);
            expect(res.body.members).toContain(userOne._id.toString());
        });
    });

    describe('GET /api/groups', () => {
        it('should get all groups a user is a member of', async () => {
            // Create a group that userOne is in
            await Group.create({ name: 'Group A', admin: userOne._id, members: [userOne._id, userTwo._id] });
            // Create a group that userOne is NOT in
            await Group.create({ name: 'Group B', admin: userTwo._id, members: [userTwo._id, userThree._id] });

            const res = await request(app)
                .get('/api/groups')
                .set('Authorization', `Bearer ${tokenOne}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Group A');
        });
    });

    describe('DELETE /api/groups/:groupId', () => {
        it('should allow the group admin to delete the group', async () => {
            const group = await Group.create({ name: 'Deletable Group', admin: userOne._id, members: [userOne._id, userTwo._id] });

            const res = await request(app)
                .delete(`/api/groups/${group._id}`)
                .set('Authorization', `Bearer ${tokenOne}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Group removed successfully.');

            // Verify the group is gone from the DB
            const deletedGroup = await Group.findById(group._id);
            expect(deletedGroup).toBeNull();
        });

        it('should NOT allow a non-admin to delete the group', async () => {
            const group = await Group.create({ name: 'Protected Group', admin: userOne._id, members: [userOne._id, userTwo._id] });
            
            // UserTwo (not the admin) tries to delete
            const res = await request(app)
                .delete(`/api/groups/${group._id}`)
                .set('Authorization', `Bearer ${tokenTwo}`);

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toBe('Not authorized to delete this group.');

            // Verify the group still exists in the DB
            const foundGroup = await Group.findById(group._id);
            expect(foundGroup).not.toBeNull();
        });
    });
});