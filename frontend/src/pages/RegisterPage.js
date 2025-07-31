import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // <-- Add state for email
    const [password, setPassword] = useState('');
    const { register } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        register(username, email, password); // <-- Pass email to the register function
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Register</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                {/* Add the new email input field */}
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Register</button>
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;