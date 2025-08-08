import React, { useState, useEffect, useRef } from 'react';
import Picker from 'emoji-picker-react';
import Message from './Message';
import api from '../services/api';
import getAvatarUrl from '../utils/getAvatarUrl';

const ChatBox = ({
    selectedChat,
    messages,
    onSendMessage,
    currentUser,
    isTyping,
    groupTypingUsers = [],
    onImageClick,
    onEditMessage,
    onDeleteMessage,
    onDeleteGroup,
    socket,
    replyingTo,
    setReplyingTo,
    setSelectedChat,
    onViewProfile
}) => {
    const [content, setContent] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // <-- State for the kebab menu
    const menuRef = useRef(null); // <-- Ref to detect outside clicks

    const isGroupChat = selectedChat?.type === 'group';
    const isAdmin = isGroupChat && selectedChat.admin === currentUser._id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, groupTypingUsers]);

    useEffect(() => {
        setContent('');
    }, [selectedChat]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const onEmojiClick = (emojiObject) => {
        setContent(prevInput => prevInput + emojiObject.emoji);
        setShowPicker(false);
    };

    const handleTyping = (e) => {
        setContent(e.target.value);
        if (!socket || !selectedChat) return;

        const event = isGroupChat ? 'startTypingGroup' : 'startTyping';
        const payload = isGroupChat ? { groupId: selectedChat._id } : { receiverId: selectedChat._id };
        socket.emit(event, payload);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            const stopEvent = isGroupChat ? 'stopTypingGroup' : 'stopTyping';
            socket.emit(stopEvent, payload);
        }, 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (content.trim()) {
            onSendMessage(content, 'text');
            setContent('');
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            const stopEvent = isGroupChat ? 'stopTypingGroup' : 'stopTyping';
            const payload = isGroupChat ? { groupId: selectedChat._id } : { receiverId: selectedChat._id };
            if (socket) socket.emit(stopEvent, payload);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const { data: filePath } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSendMessage(filePath, 'image');
        } catch (error) {
            console.error("Error uploading file", error);
            alert("Error uploading file. Images only!");
        }
    };

    if (!selectedChat) {
        return ( <div className="chat-box no-user-selected"><h2>Select a chat to start messaging</h2></div> );
    }

    return (
         <div className="chat-box">
            <div className="chat-header">
                <div className="chat-header-left">
                    <button className="back-btn" onClick={() => setSelectedChat(null)}>
                        &larr;
                    </button>
                    <img 
                        src={getAvatarUrl(selectedChat.avatar, selectedChat.name || selectedChat.username)} 
                        alt={selectedChat.name || selectedChat.username} 
                        className="avatar-img header-avatar" 
                    />
                    <h2>{selectedChat.name || selectedChat.username}</h2>
                </div>
                <div className="header-actions">
                    {isAdmin && (
                        <div className="kebab-menu" ref={menuRef}>
                            <button className="kebab-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                &#8942;
                            </button>
                            {isMenuOpen && (
                                <div className="kebab-dropdown">
                                    <button onClick={() => {
                                        onDeleteGroup(selectedChat._id);
                                        setIsMenuOpen(false);
                                    }}>
                                        Delete Group
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="messages-area">
                {messages.map((msg) => (
                    <Message
                        key={msg._id}
                        message={msg}
                        isSender={msg.sender._id === currentUser._id}
                        isGroupChat={isGroupChat}
                        onImageClick={onImageClick}
                        onEdit={onEditMessage}
                        onDelete={onDeleteMessage}
                        onSetReply={setReplyingTo}
                        onViewProfile={onViewProfile}
                    />
                ))}
                {isGroupChat && groupTypingUsers.length > 0 && (
                    <div className="typing-indicator-group">{`${groupTypingUsers.join(', ')} ${groupTypingUsers.length > 1 ? 'are' : 'is'} typing...`}</div>
                )}
                {!isGroupChat && isTyping && (
                    <div className="typing-indicator"><span></span><span></span><span></span></div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="message-input-container">
                {replyingTo && (
                    <div className="reply-banner">
                        <div className="reply-banner-content">
                            <strong>Replying to {replyingTo.sender.username}</strong>
                            <p>{replyingTo.content}</p>
                        </div>
                        <button onClick={() => setReplyingTo(null)}>&times;</button>
                    </div>
                )}
                {showPicker && (
                    <div className="emoji-picker-wrapper">
                        <Picker onEmojiClick={onEmojiClick} />
                    </div>
                )}
                <form onSubmit={handleSubmit} className="message-input-form">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/png, image/jpeg, image/jpg" />
                    <button type="button" className="upload-button" onClick={() => fileInputRef.current.click()}>+</button>
                    <button type="button" className="emoji-button" onClick={() => setShowPicker(val => !val)}>😃</button>
                    <input type="text" value={content} onChange={handleTyping} placeholder="Type a message..." autoComplete="off"/>
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;