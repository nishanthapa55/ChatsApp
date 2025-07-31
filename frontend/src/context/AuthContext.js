import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            navigate('/chat');
        } catch (error) {
            console.error('Login failed', error.response.data.message);
            alert('Login failed: ' + error.response.data.message);
        }
    };

    const register = async (username, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { username, email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            navigate('/chat');
        } catch (error) {
            console.error('Registration failed', error.response.data.message);
            alert('Registration failed: ' + error.response.data.message);
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

     const updateAvatar = async (formData) => {
        try {
            const { data: updatedUser } = await api.post('/users/profile/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // Update the user state and localStorage
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert('Avatar updated successfully!');
        } catch (error) {
            console.error('Failed to update avatar', error);
            alert('Failed to update avatar.');
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const { data: updatedUser } = await api.put('/users/profile', profileData);
            
            // Update the user state and localStorage with the new details
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert('Profile updated successfully!');
            return true; // Indicate success
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile.');
            return false; // Indicate failure
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, updateAvatar, updateProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);