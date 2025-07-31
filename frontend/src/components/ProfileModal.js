import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await updateProfile(formData);
        if (success) {
            onClose();
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" value={user.email} disabled />
                    </div>
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;