import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from './logogovt.jpeg';

export default function Footer() {
  return (
    <footer className="civic-portal-footer" role="contentinfo">
      <div className="footer-content-inner">
        <div className="footer-top-row">
          {/* Brand Identity */}
          <div className="footer-brand-side">
            <img
              src={logoImg}
              alt="Portal Logo"
              className="footer-logo-img"
            />
            <div className="footer-title-group">
              <span className="footer-title-primary">Unified Civic Scheme &amp;</span>
              <span className="footer-title-secondary">Eligibility Portal</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-center-links">
            <Link to="/" className="footer-nav-link">Home</Link>
            <span className="link-divider">|</span>
            <Link to="/schemes" className="footer-nav-link">Schemes</Link>
            <span className="link-divider">|</span>
            <Link to="/eligibility" className="footer-nav-link">Eligibility</Link>
            <span className="link-divider">|</span>
            <Link to="/login" className="footer-nav-link">Login</Link>
            <span className="link-divider">|</span>
            <Link to="/signup" className="footer-nav-link">Register</Link>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="footer-disclaimer-box">
          <p className="disclaimer-text">
            <strong>Notice &amp; Disclaimer:</strong> Unified Civic Scheme &amp; Eligibility Portal is an independent digital platform designed to help citizens discover government welfare schemes and understand eligibility criteria. This portal is not an official Government of India website or government agency. Scheme information may change, so users should verify the latest details on the respective official government portal before applying. Developed by Mahek, Kratika, Mansi & Harshita.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <span>&copy; {new Date().getFullYear()} Unified Civic Scheme &amp; Eligibility Portal. All rights reserved by Kratika, Mansi, Harshita & Mahek.</span>
          
        </div>
      </div>
    </footer>
  );
}
