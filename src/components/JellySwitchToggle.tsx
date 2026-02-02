// JellySwitchToggle Component - Smooth jelly animation for theme toggle
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './JellySwitchToggle.css';

const JellySwitchToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isChecked = theme === 'dark';

  return (
    <div className="jelly-switch-container">
      <label className="jelly-switch" aria-label="Toggle dark mode">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={toggleTheme}
          className="jelly-switch-input"
          aria-checked={isChecked}
        />
        <span className="jelly-switch-slider">
          <span className="jelly-switch-icon">
            {isChecked ? '🌙' : '☀️'}
          </span>
        </span>
      </label>
    </div>
  );
};

export default JellySwitchToggle;
