const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Add this new function ---
exports.updateUserAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const avatarPath = `/${req.file.path.replace(/\\/g, "/")}`;
        user.avatar = avatarPath;
        await user.save();

        // Return the updated user object (excluding password)
        const updatedUser = {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            token: req.headers.authorization.split(' ')[1] // Send back the same token
        };

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                phoneNumber: updatedUser.phoneNumber,
                token: req.headers.authorization.split(' ')[1]
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};