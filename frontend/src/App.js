import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // <-- Import ThemeProvider
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import './App.css';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <ThemeProvider> {/* <-- Wrap AuthProvider */}
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                            path="/chat"
                            element={
                                <PrivateRoute>
                                    <ChatPage />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/chat" />} />
                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;