const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const webpush = require('web-push');
require('dotenv').config();

// Passport config
require('./config/passport')(passport);

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const groupRoutes = require('./routes/groupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Model Imports
const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');
const GroupMessage = require('./models/GroupMessage');
const socketAuth = require('./middleware/socketAuth');

// VAPID keys for web push notifications
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};
webpush.setVapidDetails(
    'mailto:nishanthapa55@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(session({
    secret: 'securedSecretKey123', 
    resave: false,
    saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware to make io accessible in controllers
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
app.use('/api/notifications', notificationRoutes);

// Serve uploaded files statically
const dirname = path.resolve();
app.use('/uploads', express.static(path.join(dirname, '/uploads')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://chats-app-five.vercel.app"],
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

    try {
        const userGroups = await Group.find({ members: { $in: [currentUserId] } });
        userGroups.forEach(group => {
            socket.join(group._id.toString());
        });
    } catch (error) {
        console.error("Error fetching and joining user groups:", error);
    }

    io.emit('onlineUsers', Object.keys(userSocketMap));

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
            newMessage = await newMessage.populate('sender', 'username avatar firstName lastName phoneNumber email');
            newMessage = await newMessage.populate({
                path: 'replyingTo',
                populate: { path: 'sender', select: 'username avatar' }
            });

            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newMessage', newMessage);
            } else {
                const recipient = await User.findById(receiverId);
                if (recipient && recipient.pushSubscription) {
                    const payload = JSON.stringify({
                        title: `New message from ${socket.user.username}`,
                        body: content,
                        icon: `http://localhost:5000${socket.user.avatar}`
                    });
                    webpush.sendNotification(recipient.pushSubscription, payload).catch(err => console.error("Error sending notification", err));
                }
            }
            socket.emit('newMessage', newMessage);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

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
            newMessage = await newMessage.populate('sender', 'username avatar firstName lastName phoneNumber email');
            newMessage = await newMessage.populate({ 
                path: 'replyingTo', 
                populate: { path: 'sender', select: 'username avatar' } 
            });

            io.to(groupId).emit('newGroupMessage', newMessage);
            const group = await Group.findById(groupId).populate('members');
            group.members.forEach(member => {
                const memberId = member._id.toString();
                // Send to members who are NOT the sender AND are offline
                if (memberId !== socket.user._id.toString() && !userSocketMap[memberId] && member.pushSubscription) {
                     const payload = JSON.stringify({
                        title: `New message in ${group.name}`,
                        body: `${socket.user.username}: ${content}`,
                        icon: `http://localhost:5000${socket.user.avatar}`
                    });
                    webpush.sendNotification(member.pushSubscription, payload).catch(err => console.error("Error sending notification", err));
                }
            });
        } catch (error) {
            console.error('Error sending group message:', error);
        }
    });

    socket.on('editMessage', async ({ messageId, newContent }) => {
        try {
            let message = await Message.findById(messageId);
            if (message.sender.toString() !== socket.user._id.toString()) return;

            message.content = newContent;
            message.isEdited = true;
            await message.save();

            // CRITICAL FIX: Repopulate the message after saving to include sender details
            let updatedMessage = await Message.findById(message._id)
                .populate('sender', 'username avatar firstName lastName phoneNumber email')
                .populate({ path: 'replyingTo', populate: { path: 'sender', select: 'username avatar' } });

            const receiverSocketId = userSocketMap[message.receiver.toString()];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('messageEdited', updatedMessage);
            }
            socket.emit('messageEdited', updatedMessage);
        } catch (error) {
            console.error("Error editing message:", error);
        }
    });

    socket.on('deleteMessage', async ({ messageId }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message || message.sender.toString() !== socket.user._id.toString()) return;

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

    socket.on('startTypingGroup', ({ groupId }) => {
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