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
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <div className="nav-flag-stripe" aria-hidden="true">
            <div className="stripe-saffron"></div>
            <div className="stripe-white"></div>
            <div className="stripe-green"></div>
          </div>
          <div className="brand-text-block">
            <span className="brand-title">Unified Civic Scheme & Eligibility Portal</span>
            <span className="brand-subtitle">Centralized Welfare Discovery & Eligibility System</span>
          </div>
        </Link>

        <ul className="nav-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/schemes" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Browse Schemes
            </NavLink>
          </li>
          <li>
            <NavLink to="/eligibility" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Check Eligibility
            </NavLink>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active user-nav-link" : "nav-link user-nav-link"}>
                  <span className="user-avatar-badge" aria-hidden="true">&#128100;</span>
                  <span>{getFirstName(user?.full_name)} (Profile)</span>
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="nav-link nav-logout-btn"
                  title="Sign out of your account"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/signup" className={({ isActive }) => isActive ? "nav-link active nav-cta-btn" : "nav-link nav-cta-btn"}>
                  Sign Up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
