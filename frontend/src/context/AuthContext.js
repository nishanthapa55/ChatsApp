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

        // --- NEW LOGIC TO HANDLE GOOGLE REDIRECT ---
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            // If a token is in the URL, use it to fetch the user profile
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.get('/auth/me').then(res => {
                const userData = { ...res.data, token };
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                navigate('/chat');
            }).catch(err => {
                console.error("Failed to fetch user with token", err);
                localStorage.removeItem('user');
            }).finally(() => {
                setLoading(false);
            });

        } else if (storedUser) {
            setUser(JSON.parse(storedUser));
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [navigate]);

     const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            navigate('/chat');
        } catch (error) {
            // This is the updated, safer error handling
            if (error.response) {
                // The server responded with an error status code (e.g. 401 for wrong password)
                console.error('Login failed:', error.response.data.message);
                alert('Login failed: ' + error.response.data.message);
            } else {
                // A network error occurred (e.g. the server is down)
                console.error('Login failed: An unexpected error occurred', error);
                alert('Login failed: Could not connect to the server. Please make sure it is running.');
            }
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