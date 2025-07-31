const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const groupRoutes = require('./routes/groupRoutes');

// Model Imports
const Message = require('./models/Message');
const Group = require('./models/Group');
const GroupMessage = require('./models/GroupMessage');
const socketAuth = require('./middleware/socketAuth');

const app = express();
app.use(cors());
app.use(express.json());

// --- middleware ---
app.use((req, res, next) => {
    req.io = io;
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/groups', groupRoutes);

// Serve uploaded files statically
const dirname = path.resolve();
app.use('/uploads', express.static(path.join(dirname, '/uploads')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const userSocketMap = {}; // { userId: socketId }

io.use(socketAuth);

io.on('connection', async (socket) => {
    const currentUserId = socket.user._id.toString();
    console.log(`User connected: ${socket.id}, UserID: ${currentUserId}`);
    userSocketMap[currentUserId] = socket.id;

    // Join rooms for each group the user is in
    try {
        const userGroups = await Group.find({ members: { $in: [currentUserId] } });
        userGroups.forEach(group => {
            socket.join(group._id.toString());
            console.log(`User ${currentUserId} joined group room ${group._id.toString()}`);
        });
    } catch (error) {
        console.error("Error fetching and joining user groups:", error);
    }

    io.emit('onlineUsers', Object.keys(userSocketMap));

    // Handler for sending group messages
    socket.on('sendGroupMessage', async ({ groupId, content, type, replyingTo }) => {
        try {
            let newMessage = new GroupMessage({
                group: groupId,
                sender: socket.user._id,
                content,
                type,
                replyingTo
            });
            await newMessage.save();
            newMessage = await newMessage.populate('sender', 'username avatar');
            newMessage = await newMessage.populate({ path: 'replyingTo', populate: { path: 'sender', select: 'username avatar' } });


            io.to(groupId).emit('newGroupMessage', newMessage);
        } catch (error) {
            console.error('Error sending group message:', error);
        }
    });

    // --- NEW: Handlers for group typing indicators ---
    socket.on('startTypingGroup', ({ groupId }) => {
        // Broadcast to everyone in the group room except the sender
        socket.to(groupId).emit('groupTyping', {
            groupId,
            username: socket.user.username
        });
    });

    socket.on('stopTypingGroup', ({ groupId }) => {
        socket.to(groupId).emit('groupStopTyping', {
            groupId,
            username: socket.user.username
        });
    });

    // Handler for one-on-one messages
    socket.on('sendMessage', async ({ receiverId, content, type, replyingTo }) => {
        try {
            let newMessage = new Message({
                sender: socket.user._id,
                receiver: receiverId,
                content,
                type,
                replyingTo
            });
            await newMessage.save();
            newMessage = await newMessage.populate('sender', 'username avatar');
            newMessage = await newMessage.populate({ path: 'replyingTo', populate: { path: 'sender', select: 'username avatar' } });


            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newMessage', newMessage);
            }
            socket.emit('newMessage', newMessage);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    // Handler for editing one-on-one messages
    socket.on('editMessage', async ({ messageId, newContent }) => {
        try {
            const message = await Message.findById(messageId);
            if (message.sender.toString() !== socket.user._id.toString()) return;

            message.content = newContent;
            message.isEdited = true;
            const updatedMessage = await message.save();

            const receiverSocketId = userSocketMap[message.receiver.toString()];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('messageEdited', updatedMessage);
            }
            socket.emit('messageEdited', updatedMessage);
        } catch (error) {
            console.error("Error editing message:", error);
        }
    });

    // Handler for deleting one-on-one messages
    socket.on('deleteMessage', async ({ messageId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message.sender.toString() !== socket.user._id.toString()) return;

            await Message.findByIdAndDelete(messageId);

            const receiverSocketId = userSocketMap[message.receiver.toString()];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('messageDeleted', { messageId });
            }
            socket.emit('messageDeleted', { messageId });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    });

    // Handlers for typing indicators
    socket.on('startTyping', ({ receiverId }) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('typing', { senderId: socket.user._id });
        }
    });

    socket.on('stopTyping', ({ receiverId }) => {
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('stopTyping', { senderId: socket.user._id });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete userSocketMap[currentUserId];
        io.emit('onlineUsers', Object.keys(userSocketMap));
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));