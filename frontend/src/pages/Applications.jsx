import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserApplications } from '../services/api';

const STATUS_CONFIG = {
  Draft: { label: 'Draft', className: 'app-status-draft', icon: '📝' },
  'Documents Pending': { label: 'Documents Pending', className: 'app-status-pending', icon: '⏳' },
  'Ready to Submit': { label: 'Ready to Submit', className: 'app-status-ready', icon: '⚡' },
  Submitted: { label: 'Submitted', className: 'app-status-submitted', icon: '✓' },
  'Under Review': { label: 'Under Review', className: 'app-status-review', icon: '🔍' },
  Approved: { label: 'Approved', className: 'app-status-approved', icon: '🎉' },
  Rejected: { label: 'Rejected', className: 'app-status-rejected', icon: '✗' }
};

export default function Applications() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('All');

  useEffect(() => {
    async function loadApplications() {
      try {
        setLoading(true);
        setError('');
        const res = await fetchUserApplications(token);
        if (res.success && Array.isArray(res.data)) {
          setApplications(res.data);
        } else {
          setError(res.message || 'Unable to retrieve applications.');
        }
      } catch (err) {
        console.error('Fetch applications error:', err);
        setError('Failed to connect to the server. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadApplications();
    }
  }, [token]);

  const filteredApps = applications.filter(app => {
    if (filterTab === 'All') return true;
    if (filterTab === 'Drafts') return app.status === 'Draft' || app.status === 'Documents Pending' || app.status === 'Ready to Submit';
    if (filterTab === 'Submitted') return app.status === 'Submitted' || app.status === 'Under Review';
    if (filterTab === 'Decided') return app.status === 'Approved' || app.status === 'Rejected';
    return true;
  });

  const totalCount = applications.length;
  const submittedCount = applications.filter(a => a.status === 'Submitted' || a.status === 'Under Review' || a.status === 'Approved').length;
  const draftCount = applications.filter(a => a.status === 'Draft' || a.status === 'Documents Pending' || a.status === 'Ready to Submit').length;

  if (loading) {
    return (
      <div className="civic-loader-container" style={{ padding: '60px 0' }}>
        <div className="civic-spinner" role="status" aria-label="Loading applications"></div>
        <p className="civic-loader-text">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="applications-page-view">
      {/* Header */}
      <div className="applications-page-header">
        <div className="applications-header-content">
          <h1 className="applications-page-title">My Scheme Applications</h1>
          <p className="applications-page-desc">
            Monitor and manage your scheme applications, track required document checklists, and review submission progress.
          </p>
          {/* Tracking Disclaimer */}
          <div className="app-workflow-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              <strong>Portal Demonstration &amp; Internal Tracking:</strong> Applications submitted here track your readiness and internal verification status. They do not transmit data to official ministry databases. Always verify statutory notices with official department portals.
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="app-summary-stats">
          <div className="app-stat-card">
            <span className="app-stat-number">{totalCount}</span>
            <span className="app-stat-label">Total Applications</span>
          </div>
          <div className="app-stat-card">
            <span className="app-stat-number">{submittedCount}</span>
            <span className="app-stat-label">Submitted</span>
          </div>
          <div className="app-stat-card">
            <span className="app-stat-number">{draftCount}</span>
            <span className="app-stat-label">In Progress</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="app-error-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => window.location.reload()} className="btn-retry">Retry</button>
        </div>
      )}

      {/* Tabs and Controls */}
      <div className="applications-controls-bar">
        <div className="applications-filter-tabs">
          {['All', 'Drafts', 'Submitted', 'Decided'].map(tab => (
            <button
              key={tab}
              type="button"
              className={`app-tab-btn ${filterTab === tab ? 'active' : ''}`}
              onClick={() => setFilterTab(tab)}
            >
              {tab === 'All' && `All (${totalCount})`}
              {tab === 'Drafts' && `In Progress (${draftCount})`}
              {tab === 'Submitted' && `Submitted (${submittedCount})`}
              {tab === 'Decided' && `Decided (${applications.filter(a => a.status === 'Approved' || a.status === 'Rejected').length})`}
            </button>
          ))}
        </div>

        <Link to="/schemes" className="btn-new-application">
          + Explore Schemes to Apply
        </Link>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="empty-applications-card">
          <div className="empty-app-icon" aria-hidden="true">📂</div>
          <h2 className="empty-app-title">
            {filterTab === 'All' ? 'No Applications Started Yet' : `No ${filterTab} Applications Found`}
          </h2>
          <p className="empty-app-desc">
            {filterTab === 'All'
              ? 'Find schemes that match your profile, verify eligibility with your uploaded documents, and track your application submission here.'
              : `You have no applications under the "${filterTab}" filter.`}
          </p>
          <div className="empty-app-actions">
            <Link to="/schemes" className="btn-primary-action">
              Browse Schemes Catalog
            </Link>
            <Link to="/eligibility" className="btn-secondary-action">
              Check Your Eligibility
            </Link>
            <Link to="/documents" className="btn-secondary-action">
              Manage Your Documents
            </Link>
          </div>
        </div>
      ) : (
        <div className="applications-cards-grid">
          {filteredApps.map(app => {
            const statusInfo = STATUS_CONFIG[app.status] || {
              label: app.status,
              className: 'app-status-default',
              icon: '•'
            };

            return (
              <div key={app.id} className="app-item-card">
                <div className="app-card-top">
                  <div className="app-card-badge-row">
                    <span className="app-category-badge">{app.scheme_category || 'Civic Welfare'}</span>
                    <span className={`app-status-pill ${statusInfo.className}`}>
                      <span className="status-dot" aria-hidden="true">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                  </div>
                  <h3 className="app-scheme-title">
                    <Link to={`/schemes/${app.scheme_id}`}>{app.scheme_name}</Link>
                  </h3>
                  <div className="app-ref-number">
                    <span>Reference ID:</span>
                    <code>{app.reference_number}</code>
                  </div>
                </div>

                <div className="app-card-middle">
                  <div className="app-meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-val">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  {app.submission_date && (
                    <div className="app-meta-item">
                      <span className="meta-label">Submitted:</span>
                      <span className="meta-val highlight-green">
                        {new Date(app.submission_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {app.deadline && (
                    <div className="app-meta-item">
                      <span className="meta-label">Deadline:</span>
                      <span className="meta-val">{app.deadline}</span>
                    </div>
                  )}
                </div>

                <div className="app-card-bottom">
                  <Link
                    to={`/applications/${app.id}`}
                    className="btn-view-application"
                  >
                    View Application &amp; Document Checklist &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
