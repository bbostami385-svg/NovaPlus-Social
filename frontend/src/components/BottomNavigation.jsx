import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      path: '/home',
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: '🔍',
      path: '/explore',
    },
    {
      id: 'create',
      label: 'Create',
      icon: '➕',
      path: '/create',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: '💬',
      path: '/messages',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      path: '/profile',
    },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bottom-navigation">
      <div className="nav-container">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
