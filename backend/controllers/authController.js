const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.registerUser = async (req, res) => {
    // 1. Get email from the request body
    const { username, email, password } = req.body;
    try {
        const userExists = await User.findOne({ $or: [{ username }, { email }] });

        if (userExists) {
            return res.status(400).json({ message: 'User with that username or email already exists' });
        }
        
        // 2. Pass the email when creating the new user
        const user = await User.create({ username, email, password });
        
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email, // 3. (Optional) Return email in the response
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body; // <-- Change 'username' to 'email'
    try {
        // Find user by email instead of username
        const user = await User.findOne({ email }); 

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username, // Still return the username for display
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};