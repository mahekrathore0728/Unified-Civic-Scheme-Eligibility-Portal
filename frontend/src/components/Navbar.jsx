import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'Citizen';
    return fullName.split(' ')[0];
  };

  return (
    <header className="civic-navbar-wrapper">
      <nav className="civic-navbar" role="navigation" aria-label="Main Civic Navigation">
        <div className="civic-nav-container">
          {/* Brand Identity */}
          <Link to="/" className="civic-brand" title="Unified Civic Scheme & Eligibility Portal - Home">
            <div className="civic-badge-in" aria-hidden="true">
              <span>IN</span>
            </div>
            <span className="civic-brand-text">Unified Civic Scheme & Eligibility Portal</span>
          </Link>

          {/* Navigation Items & Auth */}
          <div className="civic-nav-right">
            <ul className="civic-nav-links">
              <li>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    isActive ? 'civic-nav-item active' : 'civic-nav-item'
                  }
                >
                  Home
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/schemes"
                  className={({ isActive }) =>
                    isActive ? 'civic-nav-item active' : 'civic-nav-item'
                  }
                >
                  <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Schemes</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/eligibility"
                  className={({ isActive }) =>
                    isActive ? 'civic-nav-item active' : 'civic-nav-item'
                  }
                >
                  <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Eligibility</span>
                </NavLink>
              </li>
            </ul>

            {/* Auth Action */}
            <div className="civic-nav-auth">
              {isAuthenticated ? (
                <div className="user-logged-in-menu">
                  <NavLink
                    to="/profile"
                    className="civic-nav-user-badge"
                    title="View and edit your citizen profile"
                  >
                    <svg
                      className="user-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{getFirstName(user?.full_name)}</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="civic-nav-logout-btn"
                    title="Sign out"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="civic-nav-login-btn"
                  title="Sign in to citizen or official portal"
                >
                  Citizen / Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
