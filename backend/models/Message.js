const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    isEdited: { type: Boolean, default: false },
    replyingTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;