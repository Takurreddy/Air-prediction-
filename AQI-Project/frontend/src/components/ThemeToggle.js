import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-glass)',
        color: 'var(--text-primary)',
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-primary)',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        boxShadow: 'var(--shadow-glass)'
      }}
      onMouseOver={e => {
        e.currentTarget.style.background = 'var(--bg-surface-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = 'var(--bg-surface)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {theme === 'dark' ? (
        <>
          <span>☀️</span> Light Mode
        </>
      ) : (
        <>
          <span>🌙</span> Dark Mode
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
