import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    // The 'checked' property will be true if the theme is 'dark'
    return (
        <label className="switch">
            <input 
                type="checkbox" 
                onChange={toggleTheme} 
                checked={theme === 'dark'} 
            />
            <span className="slider round"></span>
        </label>
    );
};

export default ThemeToggle;