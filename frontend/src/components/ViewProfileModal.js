import React from 'react';
import getAvatarUrl from '../utils/getAvatarUrl';

const ViewProfileModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <div className="profile-modal-header">
                    <img src={getAvatarUrl(user.avatar, user.username)} alt={user.username} className="profile-modal-avatar" />
                    <h2>{user.username}</h2>
                </div>
                <div className="profile-modal-body">
                    <div className="profile-field">
                        <strong>Full Name:</strong>
                        <span>{user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : 'Not set'}</span>
                    </div>
                    <div className="profile-field">
                        <strong>Email:</strong>
                        <span>{user.email}</span>
                    </div>
                    <div className="profile-field">
                        <strong>Phone:</strong>
                        <span>{user.phoneNumber || 'Not set'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfileModal;