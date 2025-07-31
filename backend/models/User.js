const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// In backend/models/User.js

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: {
        type: String,
        unique: true,
        sparse: true // <-- Add this
    },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;