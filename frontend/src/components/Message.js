import React, { useState } from 'react';
import getAvatarUrl from '../utils/getAvatarUrl';

const Message = ({ message, isSender, isGroupChat, onImageClick, onEdit, onDelete, onSetReply, onViewProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSaveEdit = () => {
        if (editedContent.trim()) {
            onEdit(message._id, editedContent);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            onDelete(message._id);
        }
    };

    const isImage = message.type === 'image';
    const imageUrl = `http://localhost:5000${message.content}`;

    const renderReplyQuote = (replyMessage) => {
        if (!replyMessage) return null;
        const isReplyImage = replyMessage.type === 'image';
        return (
            <div className="reply-quote">
                <strong>{replyMessage.sender.username}</strong>
                <p>{isReplyImage ? 'Photo' : (replyMessage.content.length > 70 ? `${replyMessage.content.substring(0, 70)}...` : replyMessage.content)}</p>
            </div>
        );
    };

    const content = isImage ? (
        <img src={imageUrl} alt="Sent content" className="message-image" onClick={() => onImageClick(imageUrl)} />
    ) : (
        <p className="message-content">
            {message.content}
            {message.isEdited && <span className="edited-indicator">(edited)</span>}
        </p>
    );

     return (
        <div className={`message-wrapper ${isSender ? 'sent' : 'received'}`}>
            {!isSender && (
                <img src={getAvatarUrl(message.sender.avatar)} alt={message.sender.username} className="avatar-img message-avatar" onClick={() => onViewProfile(message.sender)}
                    title={`View ${message.sender.username}'s profile`} />
            )}
            <div className="message">
                {isGroupChat && !isSender && (
                    <div className="sender-name">{message.sender.username}</div>
                )}
                {message.replyingTo && renderReplyQuote(message.replyingTo)}

                {isEditing ? (
                    <div className="edit-form">
                        <input
                            type="text"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                            autoFocus
                        />
                        <div className="edit-form-actions">
                            <button onClick={() => setIsEditing(false)} className="cancel">Cancel</button>
                            <button onClick={handleSaveEdit} className="save">Save</button>
                        </div>
                    </div>
                ) : (
                    content
                )}
                <span className="message-timestamp">{!isEditing && formatTimestamp(message.createdAt)}</span>
            </div>
            
            {!isEditing && (
                <div className="message-actions">
                    <button onClick={() => onSetReply(message)}>↩️</button>
                    {isSender && !isImage && <button onClick={() => setIsEditing(true)}>✏️</button>}
                    {isSender && <button onClick={handleDelete}>🗑️</button>}
                </div>
            )}
        </div>
    );
};

export default Message;