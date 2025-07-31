const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    replyingTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupMessage'
    }
}, { timestamps: true });

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
module.exports = GroupMessage;