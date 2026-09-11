import React from 'react';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-disclaimer-box">
          <strong>Notice & Disclaimer:</strong> This platform is an independent informational and application-tracking system.
          Users should verify scheme details, eligibility, deadlines, and application procedures on the official government portal before applying.
          Direct links to authoritative government portals are provided for each respective scheme.
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Unified Civic Scheme & Eligibility Portal. Designed for transparent citizen assistance.
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Phase 1 Core Release &bull; College Capstone Demonstration
          </div>
        </div>
      </div>
    </footer>
  );
}
