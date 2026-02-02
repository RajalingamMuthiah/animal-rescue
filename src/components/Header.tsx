// Header Component - Navigation bar with auth-aware user dropdown
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/header.css';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <span>🐾</span>
          Animal Rescue
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">
          {!isLoggedIn ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
              <Link to="/rescue" className="btn btn-primary">
                Get Started
              </Link>
            </>
          ) : (
            <div className="user-menu" ref={dropdownRef}>
              {/* User Avatar Button */}
              <button
                className="user-avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                title={user?.name}
              >
                <div className="avatar">
                  {user?.name ? getInitials(user.name) : 'U'}
                </div>
                <span className="user-name">{user?.name}</span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <strong>{user?.name}</strong>
                    <small>{user?.email}</small>
                  </div>

                  <div className="dropdown-divider"></div>

                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <span>👤</span>
                    My Profile
                  </Link>

                  <Link
                    to="/my-gallery"
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <span>🖼️</span>
                    My Gallery
                  </Link>

                  <Link
                    to="/volunteer"
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <span>🐾</span>
                    My Rescue Activity
                  </Link>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <span>🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
