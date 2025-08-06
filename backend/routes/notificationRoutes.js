const express = require('express');
const { subscribe } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/subscribe', protect, subscribe);

module.exports = router;