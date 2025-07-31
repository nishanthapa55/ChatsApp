const express = require('express');
// Make sure 'deleteGroup' is included in this list
const { createGroup, getUserGroups, getGroupMessages, deleteGroup } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, createGroup)
    .get(protect, getUserGroups);

router.route('/:groupId/messages')
    .get(protect, getGroupMessages);

router.route('/:groupId')
    .delete(protect, deleteGroup);

module.exports = router;