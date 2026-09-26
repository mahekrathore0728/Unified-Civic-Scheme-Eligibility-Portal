import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from './logogovt.jpeg';

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
    <header className="civic-header-wrapper">
      <nav className="civic-navbar" role="navigation" aria-label="Main Navigation">
        <div className="civic-nav-inner">

          <Link
            to="/"
            className="civic-brand-link"
            title="Unified Civic Scheme & Eligibility Portal"
          >
            <img
              src={logoImg}
              alt="Portal Logo"
              className="civic-portal-logo"
            />

            <div className="civic-brand-name-group">
              <span className="brand-name-primary">
                Unified Civic Scheme &amp;
              </span>
              <span className="brand-name-secondary">
                Eligibility Portal
              </span>
            </div>
          </Link>

          <ul className="civic-center-nav">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'civic-nav-link active' : 'civic-nav-link'
                }
              >
                Home
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/schemes"
                className={({ isActive }) =>
                  isActive ? 'civic-nav-link active' : 'civic-nav-link'
                }
              >
                Schemes
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/eligibility"
                className={({ isActive }) =>
                  isActive ? 'civic-nav-link active' : 'civic-nav-link'
                }
              >
                Eligibility
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  isActive ? 'civic-nav-link active' : 'civic-nav-link'
                }
              >
                Documents
              </NavLink>
            </li>
          </ul>

          <div className="civic-right-actions">
            {isAuthenticated ? (
              <div className="user-nav-actions">

                <NavLink
                  to="/applications"
                  className="user-profile-btn"
                  title="View my applications"
                >
                  <span>Applications</span>
                </NavLink>

                <NavLink
                  to="/saved"
                  className="user-profile-btn"
                  title="View saved schemes"
                >
                  <span>Saved Schemes</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  className="user-profile-btn"
                  title="View and edit citizen profile"
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

                  <span>
                    {getFirstName(user?.full_name)} (Profile)
                  </span>
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-logout"
                  title="Sign out"
                >
                  Logout
                </button>

              </div>
            ) : (
              <div className="auth-nav-actions">

                <Link to="/login" className="btn-nav-login">
                  <svg
                    className="login-icon"
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

                  <span>Login</span>
                </Link>

                <Link to="/signup" className="btn-nav-register">
                  Register
                </Link>

              </div>
            )}
          </div>

        </div>
      </nav>
    </header>
  );
}