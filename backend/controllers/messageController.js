const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.receiverId },
                { sender: req.params.receiverId, receiver: req.user.id }
            ]
        })
        .populate('sender', 'username avatar firstName lastName phoneNumber email')
        .populate({
            path: 'replyingTo',
            populate: {
                path: 'sender',
                select: 'username avatar firstName lastName phoneNumber email'
            }
        })
        .sort({ createdAt: 'asc' });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};