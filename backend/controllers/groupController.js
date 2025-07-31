const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

// @desc    Create a new group
// @route   POST /api/groups
exports.createGroup = async (req, res) => {
    const { name, members } = req.body;

    if (!name || !members || members.length < 1) {
        return res.status(400).json({ message: 'Please provide a group name and at least one member.' });
    }

    try {
        const group = await Group.create({
            name,
            members: [...members, req.user.id], // Add the creator to the group
            admin: req.user.id,
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all groups for a user
// @route   GET /api/groups
exports.getUserGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: { $in: [req.user.id] } })
            .populate('members', 'username')
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a specific group
// @route   GET /api/groups/:groupId/messages
exports.getGroupMessages = async (req, res) => {
    try {
        const messages = await GroupMessage.find({ group: req.params.groupId })
            .populate('sender', 'username avatar')
            .populate({ // Populate the replied-to message and its sender
                path: 'replyingTo',
                populate: {
                    path: 'sender',
                    select: 'username avatar'
                }
            })
            .sort({ createdAt: 'asc' });
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);

        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        if (group.admin.toString() !== req.user.id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this group.' });
        }

        // Delete all messages associated with the group
        await GroupMessage.deleteMany({ group: req.params.groupId });

        // Delete the group itself using a more direct method
        await Group.findByIdAndDelete(req.params.groupId);

        res.json({ message: 'Group removed successfully.' });

    } catch (error) {
        // If this still fails, the error will be logged in your backend terminal
        console.error("Error in deleteGroup:", error); 
        res.status(500).json({ message: 'Server Error' });
    }
};