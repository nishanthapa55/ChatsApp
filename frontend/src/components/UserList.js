import React, { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

// Helper to get full image URL
const getAvatarUrl = (avatarPath, seed) => {
    if (avatarPath) {
        return `http://localhost:5000${avatarPath}`;
    }
    // Return a consistent placeholder avatar based on a seed (like username or ID)
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
};

const UserList = ({ users, groups, onSelectChat, selectedChat, logout, onlineUsers, unreadCounts, onOpenCreateGroupModal, onOpenProfileModal }) => {
    const { user, updateAvatar } = useAuth();
    const avatarInputRef = useRef(null);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);
            updateAvatar(formData);
        }
    };

    return (
        <div className="user-list-container">
            <div className="user-list-header">
                <h3>Chats</h3>
                <div className="header-controls">
                    <button className="create-group-btn" onClick={onOpenCreateGroupModal}>+</button>
                    <ThemeToggle />
                    <button onClick={logout} className="logout-button">Logout</button>
                </div>
            </div>
            
            <div className="chat-list-sections">
                {/* Groups Section */}
                <div className="chat-list-section">
                    <h4>Groups</h4>
                    <ul className="user-list">
                        {groups.map((group) => {
                            const isSelected = selectedChat?._id === group._id;
                            const unreadCount = unreadCounts[group._id] || 0;
                            return (
                                <li
                                    key={group._id}
                                    className={`user-list-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => onSelectChat({ ...group, type: 'group' })}
                                >
                                    <span className="username-wrapper">
                                        {group.name}
                                    </span>
                                    {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Direct Messages Section */}
                <div className="chat-list-section">
                    <h4>Direct Messages</h4>
                    <ul className="user-list">
                        {users.map((chatUser) => {
                            const isSelected = selectedChat?._id === chatUser._id;
                            const isOnline = onlineUsers.includes(chatUser._id);
                            const unreadCount = unreadCounts[chatUser._id] || 0;

                            return (
                                <li
                                    key={chatUser._id}
                                    className={`user-list-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => onSelectChat({ ...chatUser, type: 'user' })}
                                >
                                    <img src={getAvatarUrl(chatUser.avatar, chatUser.username)} alt={chatUser.username} className="avatar-img" />
                                    <span className="username-wrapper">
                                        {chatUser.username}
                                        {isOnline && <span className="online-indicator"></span>}
                                    </span>
                                    {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Current User Profile Section */}
            <div className="current-user-profile">
                <input 
                    type="file" 
                    ref={avatarInputRef} 
                    style={{display: 'none'}} 
                    onChange={handleAvatarChange}
                    accept="image/png, image/jpeg, image/jpg"
                />
                <img 
                    src={getAvatarUrl(user?.avatar, user?.username)} 
                    alt={user?.username} 
                    className="avatar-img profile"
                    onClick={() => avatarInputRef.current.click()}
                    title="Click to change avatar"
                />
                <div className="profile-info">
                    <span className="username">{user?.username}</span>
                    <button className="profile-btn" onClick={onOpenProfileModal}>Edit Profile</button>
                </div>
            </div>
        </div>
    );
};

export default UserList;