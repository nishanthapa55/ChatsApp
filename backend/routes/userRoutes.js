const express = require('express');
// Make sure 'updateUserProfile' is included in this list
const { getAllUsers, updateUserAvatar, updateUserProfile } = require('../controllers/userController'); 
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Route to get all users (for the sidebar)
router.get('/', protect, getAllUsers);

// Route for avatar uploads
router.post('/profile/avatar', protect, upload.single('avatar'), updateUserAvatar);

// Route for updating text profile details
router.put('/profile', protect, updateUserProfile);

module.exports = router;