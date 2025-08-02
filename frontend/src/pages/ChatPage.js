import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import UserList from '../components/UserList';
import ChatBox from '../components/ChatBox';
import Lightbox from '../components/Lightbox';
import CreateGroupModal from '../components/CreateGroupModal';
import api from '../services/api';
import ProfileModal from '../components/ProfileModal'; 
import ViewProfileModal from '../components/ViewProfileModal';

const ChatPage = () => {
    const { user, logout, updateAvatar } = useAuth();
    
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [groupTypingUsers, setGroupTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [lightboxImage, setLightboxImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [viewingProfile, setViewingProfile] = useState(null);
    const socketRef = useRef();
    
    const selectedChatRef = useRef(selectedChat);
    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, groupsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/groups')
                ]);
                setUsers(usersRes.data);
                setGroups(groupsRes.data);
            } catch (error) { console.error("Failed to fetch data", error); }
        };
        fetchData();

        socketRef.current = io('http://localhost:5000', {
            auth: { token: user.token },
        });

        socketRef.current.on('connect', () => console.log('Connected to socket server'));
        socketRef.current.on('onlineUsers', (users) => setOnlineUsers(users));

        socketRef.current.on('profileUpdated', (updatedUser) => {
            setUsers(prevUsers => 
                prevUsers.map(u => u._id === updatedUser._id ? { ...u, ...updatedUser } : u)
            );
            const currentChat = selectedChatRef.current;
            if (currentChat?._id === updatedUser._id) {
                setSelectedChat(prev => ({ ...prev, ...updatedUser }));
            }
        });

        socketRef.current.on('newMessage', (message) => {
            const currentChat = selectedChatRef.current;
            if (currentChat?.type === 'user' && (message.sender._id === currentChat?._id || message.receiver === currentChat?._id)) {
                setMessages(prev => [...prev, message]);
            } else {
                setUnreadCounts(prev => ({ ...prev, [message.sender._id]: (prev[message.sender._id] || 0) + 1 }));
            }
        });

        socketRef.current.on('newGroupMessage', (message) => {
            const currentChat = selectedChatRef.current;
            if (currentChat?.type === 'group' && message.group === currentChat?._id) {
                setMessages(prev => [...prev, message]);
            } else {
                setUnreadCounts(prev => ({ ...prev, [message.group]: (prev[message.group] || 0) + 1 }));
            }
        });
        
        socketRef.current.on('typing', ({ senderId }) => {
            const currentChat = selectedChatRef.current;
            if (currentChat?.type === 'user' && currentChat?._id === senderId) setIsTyping(true);
        });
        socketRef.current.on('stopTyping', ({ senderId }) => {
            const currentChat = selectedChatRef.current;
            if (currentChat?.type === 'user' && currentChat?._id === senderId) setIsTyping(false);
        });
        socketRef.current.on('groupTyping', ({ groupId, username }) => {
            const currentChat = selectedChatRef.current;
            if (currentChat?._id === groupId) setGroupTypingUsers(prev => [...new Set([...prev, username])]);
        });
        socketRef.current.on('groupStopTyping', ({ groupId, username }) => {
            const currentChat = selectedChatRef.current;
            if (currentChat?._id === groupId) setGroupTypingUsers(prev => prev.filter(u => u !== username));
        });

        socketRef.current.on('messageEdited', (editedMessage) => {
            setMessages((prev) => prev.map(msg => msg._id === editedMessage._id ? editedMessage : msg));
        });
        socketRef.current.on('messageDeleted', ({ messageId }) => {
            setMessages((prev) => prev.filter(msg => msg._id !== messageId));
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            if (err.message.includes('token')) logout();
        });

        return () => {
            socketRef.current.disconnect();
            socketRef.current.off();
        };
    }, [user.token, logout]);

    useEffect(() => {
        setMessages([]);
        setReplyingTo(null);
        setIsTyping(false);
        setGroupTypingUsers([]);

        if (selectedChat) {
            if (selectedChat.type === 'user') {
                setUnreadCounts(prev => ({ ...prev, [selectedChat._id]: 0 }));
            }
            
            const fetchMessages = async () => {
                const endpoint = selectedChat.type === 'group'
                    ? `/groups/${selectedChat._id}/messages`
                    : `/messages/${selectedChat._id}`;
                try {
                    const { data } = await api.get(endpoint);
                    setMessages(data);
                } catch (error) { console.error("Failed to fetch messages", error); }
            };
            fetchMessages();
        }
    }, [selectedChat]);

    const handleSendMessage = useCallback((content, type = 'text') => {
        if (!selectedChat || !socketRef.current) return;
        const event = selectedChat.type === 'group' ? 'sendGroupMessage' : 'sendMessage';
        const payload = { content, type, replyingTo: replyingTo?._id };
        if (selectedChat.type === 'group') {
            payload.groupId = selectedChat._id;
        } else {
            payload.receiverId = selectedChat._id;
        }
        socketRef.current.emit(event, payload);
        setReplyingTo(null);
    }, [selectedChat, replyingTo]);

    const handleEditMessage = (messageId, newContent) => { if (socketRef.current) socketRef.current.emit('editMessage', { messageId, newContent }); };
    const handleDeleteMessage = (messageId) => { if (socketRef.current) socketRef.current.emit('deleteMessage', { messageId }); };
    const handleImageClick = (imageUrl) => { setLightboxImage(imageUrl); };
    const onGroupCreated = (newGroup) => {
        setGroups(prev => [newGroup, ...prev]);
        setSelectedChat({ ...newGroup, type: 'group' });
    };

    const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
        try {
            await api.delete(`/groups/${groupId}`);
            
            // Remove the group from the local state list
            setGroups(prev => prev.filter(g => g._id !== groupId));

            // If the deleted group was the selected chat, clear the selection
            if (selectedChat?._id === groupId) {
                setSelectedChat(null);
            }
            
            alert('Group deleted successfully.');
        } catch (error) {
            console.error('Failed to delete group', error);
            alert('Failed to delete group.');
        }
    }
    };

    return (
        <div className="chat-container">
            <UserList 
                users={users}
                groups={groups}
                onSelectChat={setSelectedChat}
                selectedChat={selectedChat}
                logout={logout} 
                onlineUsers={onlineUsers}
                unreadCounts={unreadCounts}
                onOpenCreateGroupModal={() => setIsModalOpen(true)}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                updateAvatar={updateAvatar}
            />
            <ChatBox
                selectedChat={selectedChat}
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={user}
                isTyping={isTyping}
                groupTypingUsers={groupTypingUsers}
                onImageClick={handleImageClick}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                socket={socketRef.current}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onDeleteGroup={handleDeleteGroup}
                onViewProfile={setViewingProfile}
            />
            <CreateGroupModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                users={users}
                onGroupCreated={onGroupCreated}
            />
            {lightboxImage && (
                <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
            )}
            <ProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
            <ViewProfileModal 
                user={viewingProfile}
                onClose={() => setViewingProfile(null)}
            />
        </div>
    );
};

export default ChatPage;