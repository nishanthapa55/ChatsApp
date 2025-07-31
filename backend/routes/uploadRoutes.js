const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Save files to the 'uploads' folder
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// The upload endpoint
router.post('/', protect, upload.single('image'), (req, res) => {
    // On success, multer adds a `file` object to the request.
    // We send back the path to the uploaded file.
    res.send(`/${req.file.path.replace(/\\/g, "/")}`); // replace backslashes for windows
});

module.exports = router;