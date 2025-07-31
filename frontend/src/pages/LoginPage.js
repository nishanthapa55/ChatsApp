import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState(''); // <-- Change state from username to email
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        login(email, password); // <-- Pass email to the login function
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Login</h2>
                {/* Change the input field from username to email */}
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
                <button type="submit">Login</button>
                <p>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;