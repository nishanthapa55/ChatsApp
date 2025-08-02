const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

exports.createGroup = async (req, res) => {
    const { name, members } = req.body;
    if (!name || !members || members.length < 1) {
        return res.status(400).json({ message: 'Please provide a group name and at least one member.' });
    }
    try {
        const group = await Group.create({
            name,
            members: [...members, req.user.id],
            admin: req.user.id,
        });
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

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

exports.getGroupMessages = async (req, res) => {
    try {
        const messages = await GroupMessage.find({ group: req.params.groupId })
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

exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        if (group.admin.toString() !== req.user.id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this group.' });
        }
        await GroupMessage.deleteMany({ group: req.params.groupId });
        await Group.findByIdAndDelete(req.params.groupId);
        res.json({ message: 'Group removed successfully.' });
    } catch (error) {
        console.error("Error in deleteGroup:", error); 
        res.status(500).json({ message: 'Server Error' });
    }
};