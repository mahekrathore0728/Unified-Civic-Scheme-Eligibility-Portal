import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchApplicationDetail,
  submitApplication,
  viewDocument
} from '../services/api';

const STATUS_PROGRESS = [
  'Draft',
  'Documents Pending',
  'Ready to Submit',
  'Submitted',
  'Under Review',
  'Approved'
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null); // { url, mimeType, filename }

  async function loadDetail() {
    try {
      setLoading(true);
      setError('');
      const res = await fetchApplicationDetail(id, token);
      if (res.success && res.data) {
        setApplication(res.data);
      } else {
        setError(res.message || 'Unable to retrieve application details.');
      }
    } catch (err) {
      console.error('Fetch application detail error:', err);
      setError('Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && id) {
      loadDetail();
    }
  }, [id, token]);

  const handleSubmit = async () => {
    if (!application) return;

    if (application.missing_mandatory_docs && application.missing_mandatory_docs.length > 0) {
      setSubmitError(`Cannot submit: Missing ${application.missing_mandatory_docs.length} mandatory document(s): ${application.missing_mandatory_docs.join(', ')}`);
      return;
    }

    if (!window.confirm('Are you ready to submit this application for internal portal verification? Ensure all required documents are accurate.')) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const res = await submitApplication(id, token);
      if (res.success) {
        setSubmitSuccess('Application submitted successfully for internal portal verification!');
        await loadDetail();
      } else {
        setSubmitError(res.message || 'Failed to submit application.');
      }
    } catch (err) {
      console.error('Submit application error:', err);
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = async (docId, filename) => {
    try {
      const { blob, mimeType } = await viewDocument(docId, token);
      const url = URL.createObjectURL(blob);
      setViewingDoc({ url, mimeType: mimeType || 'application/pdf', filename });
    } catch (err) {
      alert(`Unable to preview document: ${err.message}`);
    }
  };

  const closeViewer = () => {
    if (viewingDoc?.url) {
      URL.revokeObjectURL(viewingDoc.url);
    }
    setViewingDoc(null);
  };

  if (loading) {
    return (
      <div className="civic-loader-container" style={{ padding: '60px 0' }}>
        <div className="civic-spinner" role="status" aria-label="Loading application details"></div>
        <p className="civic-loader-text">Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="app-detail-error-container">
        <div className="error-card">
          <h2>Application Not Accessible</h2>
          <p>{error || 'The requested application could not be located.'}</p>
          <Link to="/applications" className="btn-return">
            &larr; Back to My Applications
          </Link>
        </div>
      </div>
    );
  }

  const isSubmitted = ['Submitted', 'Under Review', 'Approved', 'Rejected'].includes(application.status);
  const checklist = application.doc_checklist || [];
  const missingMandatory = application.missing_mandatory_docs || [];
  const canSubmit = application.can_submit && !isSubmitted;

  return (
    <div className="app-detail-page-view">
      {/* Navigation Breadcrumb */}
      <div className="app-detail-breadcrumb">
        <Link to="/applications" className="breadcrumb-back-link">
          &larr; Back to All Applications
        </Link>
      </div>

      {/* Main Detail Header Card */}
      <header className="app-detail-header-card">
        <div className="header-meta-row">
          <div className="ref-badge-group">
            <span className="ref-tag">Application Reference</span>
            <code className="ref-code">{application.reference_number}</code>
          </div>
          <span className={`detail-status-pill app-status-${application.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {application.status}
          </span>
        </div>

        <h1 className="app-detail-scheme-title">
          <Link to={`/schemes/${application.scheme_id}`} title="View full scheme guidelines">
            {application.scheme_name}
          </Link>
        </h1>

        <div className="app-detail-meta-strip">
          <div className="meta-strip-item">
            <span className="strip-label">Scheme Category:</span>
            <span className="strip-value">{application.scheme_category || 'Civic Welfare'}</span>
          </div>
          <div className="meta-strip-item">
            <span className="strip-label">Created Date:</span>
            <span className="strip-value">
              {application.created_at ? new Date(application.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
          {application.submission_date && (
            <div className="meta-strip-item">
              <span className="strip-label">Submitted On:</span>
              <span className="strip-value highlight-green">
                {new Date(application.submission_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Workflow / Disclaimer Notice */}
        <div className="app-tracking-disclaimer" role="note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="disclaimer-text-group">
            <strong>Internal Portal Verification Workflow:</strong>
            <span>
              This application status is maintained within this portal to assist your application preparation and verify required documentation. It does not submit data to statutory government databases. Official claims must be verified via the official department portal.
            </span>
          </div>
        </div>
      </header>

      {/* Notifications / Feedback Banners */}
      {submitSuccess && (
        <div className="app-success-banner" role="status">
          <span className="banner-icon">✓</span>
          <span>{submitSuccess}</span>
        </div>
      )}

      {submitError && (
        <div className="app-error-banner" role="alert">
          <span className="banner-icon">⚠</span>
          <span>{submitError}</span>
        </div>
      )}

      <div className="app-detail-body-grid">
        {/* Left Column: Document Checklist */}
        <div className="detail-col-main">
          <section className="detail-card checklist-section">
            <div className="section-title-row">
              <h2 className="section-title">Required Documents Checklist</h2>
              <span className="checklist-counter">
                {checklist.filter(c => c.present).length} of {checklist.length} Available
              </span>
            </div>

            <p className="section-desc">
              Each scheme specifies the required supporting documents. Mandatory documents must be uploaded in your Documents vault before this application can be submitted.
            </p>

            {/* Missing Warning Box */}
            {missingMandatory.length > 0 && !isSubmitted && (
              <div className="missing-docs-alert">
                <div className="alert-head">
                  <span className="alert-icon">⚠</span>
                  <strong>{missingMandatory.length} Mandatory Document(s) Missing:</strong>
                </div>
                <ul className="missing-docs-list">
                  {missingMandatory.map((mDoc, idx) => (
                    <li key={idx}>{mDoc}</li>
                  ))}
                </ul>
                <p className="alert-footer">
                  Please upload these documents in your <Link to="/documents" className="link-vault">Documents Vault</Link> to enable submission.
                </p>
              </div>
            )}

            {/* Checklist Table / List */}
            <div className="docs-checklist-container">
              {checklist.length === 0 ? (
                <p className="empty-subtext">No specific document requirements recorded for this scheme.</p>
              ) : (
                <div className="checklist-items-stack">
                  {checklist.map((item, idx) => {
                    const isPresent = item.present;
                    const isMandatory = item.is_mandatory;

                    return (
                      <div
                        key={idx}
                        className={`checklist-item-row ${isPresent ? 'item-present' : isMandatory ? 'item-missing-mandatory' : 'item-missing-optional'}`}
                      >
                        <div className="item-status-icon" aria-hidden="true">
                          {isPresent ? (
                            <span className="icon-check">✓</span>
                          ) : (
                            <span className="icon-cross">{isMandatory ? '✗' : '○'}</span>
                          )}
                        </div>

                        <div className="item-info">
                          <div className="item-title-row">
                            <span className="item-doc-name">{item.display_label}</span>
                            <span className={`tag-requirement ${isMandatory ? 'tag-mandatory' : 'tag-optional'}`}>
                              {isMandatory ? 'Mandatory' : 'Optional'}
                            </span>
                          </div>

                          <div className="item-meta">
                            {isPresent ? (
                              <>
                                <span className="item-status-tag tag-present">Uploaded</span>
                                {item.original_filename && (
                                  <span className="item-filename" title={item.original_filename}>
                                    📄 {item.original_filename}
                                  </span>
                                )}
                                {item.uploaded_at && (
                                  <span className="item-date">
                                    on {new Date(item.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="item-status-tag tag-missing">
                                {isMandatory ? 'Missing (Required to Submit)' : 'Not Uploaded (Recommended)'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="item-actions">
                          {isPresent && item.user_doc_id ? (
                            <button
                              type="button"
                              onClick={() => handleViewDocument(item.user_doc_id, item.original_filename)}
                              className="btn-item-view"
                              title="Preview document safely"
                            >
                              View
                            </button>
                          ) : (
                            <Link
                              to="/documents"
                              className="btn-item-upload"
                              title="Go to Documents to upload"
                            >
                              Upload &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Submission & Eligibility Snapshot */}
        <div className="detail-col-side">
          {/* Submission Action Card */}
          <div className="detail-card submission-action-card">
            <h3 className="side-card-title">Application Status</h3>

            <div className="status-indicator-block">
              <span className={`status-large-badge app-status-${application.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {application.status}
              </span>
              <p className="status-narrative">
                {application.status === 'Submitted' && 'Application has been successfully submitted for internal portal verification.'}
                {application.status === 'Draft' && missingMandatory.length === 0 && 'All mandatory documents uploaded. Ready for submission.'}
                {application.status === 'Draft' && missingMandatory.length > 0 && `${missingMandatory.length} mandatory document(s) must be uploaded before submitting.`}
                {application.status === 'Under Review' && 'Application is currently under review by portal verification team.'}
                {application.status === 'Approved' && 'Application criteria and documents have been internally validated.'}
                {application.status === 'Rejected' && 'Application did not meet internal criteria or documentation requirements.'}
              </p>
            </div>

            {/* Submission Button */}
            {!isSubmitted ? (
              <div className="submission-btn-group">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className={`btn-primary-submit ${!canSubmit ? 'btn-disabled' : ''}`}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application Now'}
                </button>

                {!canSubmit && (
                  <p className="submit-disabled-help">
                    {missingMandatory.length > 0
                      ? 'Upload all mandatory documents in your vault to unlock submission.'
                      : 'Please review your application criteria and documents.'}
                  </p>
                )}
              </div>
            ) : (
              <div className="submitted-confirmed-box">
                <div className="confirmed-icon">✓</div>
                <h4>Application Submitted</h4>
                <p>
                  Submitted on {application.submission_date ? new Date(application.submission_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'recently'}.
                </p>
                <div className="submitted-ref">
                  <span>Tracking ID: <strong>{application.reference_number}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Eligibility Snapshot Card */}
          {application.eligibility_snapshot && application.eligibility_snapshot.profile_at_creation && (
            <div className="detail-card snapshot-card">
              <h3 className="side-card-title">Profile Snapshot</h3>
              <p className="snapshot-desc">
                Citizen profile details recorded at the time this application was created:
              </p>
              <div className="snapshot-specs">
                {Object.entries(application.eligibility_snapshot.profile_at_creation).map(([key, val]) => {
                  if (val == null) return null;
                  const labelMap = {
                    age: 'Age',
                    gender: 'Gender',
                    state: 'State',
                    annual_income: 'Annual Income',
                    category: 'Social Category'
                  };
                  const displayLabel = labelMap[key] || key;
                  const displayVal = key === 'annual_income' ? `₹${Number(val).toLocaleString('en-IN')}` : String(val);

                  return (
                    <div key={key} className="snapshot-row">
                      <span className="snap-label">{displayLabel}:</span>
                      <span className="snap-val">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Links Card */}
          <div className="detail-card side-links-card">
            <h3 className="side-card-title">Quick Actions</h3>
            <ul className="side-links-list">
              <li>
                <Link to="/documents" className="side-link-action">
                  📁 Open Documents Vault
                </Link>
              </li>
              <li>
                <Link to={`/schemes/${application.scheme_id}`} className="side-link-action">
                  📄 View Official Scheme Guidelines
                </Link>
              </li>
              <li>
                <Link to="/profile" className="side-link-action">
                  👤 Review Citizen Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document Safe Viewer Modal */}
      {viewingDoc && (
        <div className="doc-viewer-modal-backdrop" onClick={closeViewer}>
          <div className="doc-viewer-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="doc-viewer-header">
              <h3 className="viewer-title">{viewingDoc.filename || 'Document Preview'}</h3>
              <button type="button" onClick={closeViewer} className="btn-close-viewer" aria-label="Close viewer">
                ✕
              </button>
            </div>
            <div className="doc-viewer-body">
              {viewingDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={viewingDoc.url}
                  title="PDF Preview"
                  className="pdf-viewer-frame"
                />
              ) : (
                <img
                  src={viewingDoc.url}
                  alt="Document Preview"
                  className="image-viewer-preview"
                />
              )}
            </div>
            <div className="doc-viewer-footer">
              <span className="viewer-safe-notice">
                Secure authenticated view. Document is not exposed to public URLs.
              </span>
              <button type="button" onClick={closeViewer} className="btn-viewer-close">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
