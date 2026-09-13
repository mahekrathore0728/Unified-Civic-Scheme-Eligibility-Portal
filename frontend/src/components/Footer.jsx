import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="civic-footer" role="contentinfo">
      <div className="civic-footer-main">
        <div className="civic-footer-grid">
          {/* Col 1: Identity & Description */}
          <div className="civic-footer-col col-identity">
            <div className="footer-brand-row">
              <div className="civic-badge-in" aria-hidden="true">
                <span>IN</span>
              </div>
              <span className="footer-brand-name">Unified Civic Scheme & Eligibility Portal</span>
            </div>
            <p className="footer-description">
              A centralized digital civic-tech platform empowering Indian citizens to discover government
              welfare schemes, verify deterministic eligibility criteria, and access public entitlements transparently.
            </p>
            <div className="footer-support-box">
              <div className="support-item">
                <svg
                  className="support-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Civic Citizen Helpdesk: 1800-11-2026 (Toll-Free)</span>
              </div>
              <div className="support-item">
                <svg
                  className="support-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>National Portal Support: support@civicportal.gov.in</span>
              </div>
            </div>
          </div>

          {/* Col 2: Portal Navigation */}
          <div className="civic-footer-col">
            <h4 className="footer-col-title">Portal Navigation</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/">Home & Overview</Link>
              </li>
              <li>
                <Link to="/schemes">Explore All Schemes</Link>
              </li>
              <li>
                <Link to="/eligibility">Eligibility Checker</Link>
              </li>
              <li>
                <Link to="/profile">Citizen Profile & Status</Link>
              </li>
              <li>
                <Link to="/login">Citizen Sign In / Register</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Scheme Sectors */}
          <div className="civic-footer-col">
            <h4 className="footer-col-title">Scheme Sectors</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/schemes?category=Agriculture">Agriculture & Farmers Welfare</Link>
              </li>
              <li>
                <Link to="/schemes?category=Education">Higher Education & Scholarships</Link>
              </li>
              <li>
                <Link to="/schemes?category=Healthcare">Health Assurance & PM-JAY</Link>
              </li>
              <li>
                <Link to="/schemes?category=Housing">Housing for All (PMAY)</Link>
              </li>
              <li>
                <Link to="/schemes?category=Employment">Employment & Skill Development</Link>
              </li>
              <li>
                <Link to="/schemes?category=Women%20%26%20Child">Women & Child Development</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Important Disclaimer */}
          <div className="civic-footer-col">
            <h4 className="footer-col-title">Important Disclaimer</h4>
            <p className="footer-disclaimer-text">
              <strong>Public Information Notice:</strong> This portal provides deterministic scheme eligibility
              verification based on statutory eligibility guidelines. Official applications are processed exclusively
              on verified government websites linked within each scheme.
            </p>
            <p className="footer-disclaimer-subtext">
              Citizens are advised to verify latest documentation rules and official notifications directly on the respective ministerial portal before final submission.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="civic-footer-bottom">
        <div className="civic-footer-bottom-inner">
          <div className="bottom-text-left">
            &copy; {new Date().getFullYear()} Unified Civic Scheme & Eligibility Portal &bull; Official Civic Services Platform
          </div>
          <div className="bottom-text-right">
            Strictly Non-Commercial &bull; All Scheme Information is Based on Public Government Records
          </div>
        </div>
      </div>
    </footer>
  );
}
