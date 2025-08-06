import axios from 'axios';

// The base URL for the API, either from environment variables or localhost for development
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
    } catch (e) {
        console.error("Could not parse user from localStorage", e);
    }
    return config;
});

export default api;