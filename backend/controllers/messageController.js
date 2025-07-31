const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.receiverId },
                { sender: req.params.receiverId, receiver: req.user.id }
            ]
        })
        .populate('sender', 'username avatar')
        .populate({ // <-- Populate the replied-to message and its sender
            path: 'replyingTo',
            populate: {
                path: 'sender',
                select: 'username avatar'
            }
        }).sort({ createdAt: 'asc' });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};