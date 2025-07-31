import React, { useState } from 'react';
import api from '../services/api';

const CreateGroupModal = ({ isOpen, onClose, users, onGroupCreated }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    const handleMemberSelect = (userId) => {
        setSelectedMembers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName || selectedMembers.length === 0) {
            alert('Please provide a group name and select at least one member.');
            return;
        }

        try {
            const { data: newGroup } = await api.post('/groups', {
                name: groupName,
                members: selectedMembers,
            });
            onGroupCreated(newGroup);
            onClose(); // Close modal on success
        } catch (error) {
            console.error('Error creating group', error);
            alert('Failed to create group.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create New Group</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                    />
                    <h4>Select Members</h4>
                    <ul className="members-list">
                        {users.map(user => (
                            <li key={user._id} onClick={() => handleMemberSelect(user._id)}>
                                <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(user._id)}
                                    readOnly
                                />
                                {user.username}
                            </li>
                        ))}
                    </ul>
                    <div className="modal-actions">
                        <button type="submit">Create Group</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;