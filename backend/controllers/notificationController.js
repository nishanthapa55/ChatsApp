const User = require('../models/User');
exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { pushSubscription: subscription },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Subscription saved.' });
    } catch (error) {
        console.error('Error in subscribe controller:', error);
        res.status(500).json({ message: 'Server error' });
    }
};