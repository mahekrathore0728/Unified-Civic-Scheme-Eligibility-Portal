import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
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
            <NavLink to="/eligibility" className={({ isActive }) => isActive ? "nav-link active nav-cta-btn" : "nav-link nav-cta-btn"}>
              Check Eligibility
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
