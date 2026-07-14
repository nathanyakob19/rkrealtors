import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Home, Compass, LayoutDashboard, KeyRound } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  return (
    <nav className="glass-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">RK</div>
          <div className="logo-text">
            <span className="brand-name">RK REALTOR</span>
            <span className="brand-tagline">Find • Buy • Rent • Design</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <Link to="/properties" className="nav-link">
            <Home size={18} />
            Properties
          </Link>
          <Link to="/designs" className="nav-link">
            <Compass size={18} />
            Design Hub
          </Link>
          {user && (
            <Link to="/dashboard" className="nav-link">
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          )}
        </div>

        {/* Right side Profile / Login */}
        <div className="navbar-actions">
          {user ? (
            <div className="profile-dropdown-container">
              <button 
                className="profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <img src={user.avatar} alt={user.name} className="avatar-img" />
                <span className="user-name-desktop">{user.name}</span>
                <span className="role-tag">{user.role}</span>
              </button>
              {showDropdown && (
                <div className="dropdown-menu animate-fade-in">
                  <div className="dropdown-header">
                    <strong>{user.name}</strong>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <Link 
                    to="/dashboard" 
                    className="dropdown-item" 
                    onClick={() => setShowDropdown(false)}
                  >
                    <LayoutDashboard size={16} />
                    My Dashboard
                  </Link>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm login-btn">
              <KeyRound size={16} />
              Sign In
            </Link>
          )}

          {/* Mobile menu button */}
          <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Links */}
      {isOpen && (
        <div className="mobile-navbar-links animate-fade-in">
          <Link to="/properties" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
            Properties
          </Link>
          <Link to="/designs" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
            Design Hub
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
                Dashboard ({user.role})
              </Link>
              <button className="mobile-nav-link logout-btn" onClick={() => { setIsOpen(false); handleLogout(); }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-nav-link" onClick={() => setIsOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
