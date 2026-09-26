import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserDocuments,
  uploadDocument,
  deleteDocument,
  reprocessDocument,
  viewDocument
} from '../services/api';

const DOC_TYPE_INFO = {
  aadhaar: {
    label: 'Aadhaar / Identity Proof',
    category: 'identity',
    description: 'Government-issued Aadhaar card or identity proof',
    icon: '🪪',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  income_certificate: {
    label: 'Income Certificate',
    category: 'income',
    description: 'Annual family income certificate issued by competent authority',
    icon: '💰',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  caste_certificate: {
    label: 'Caste Certificate',
    category: 'income',
    description: 'Caste/category certificate (SC/ST/OBC/EWS) from competent authority',
    icon: '📋',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  domicile_certificate: {
    label: 'Domicile Certificate',
    category: 'identity',
    description: 'State domicile / residence certificate',
    icon: '🏠',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  bank_passbook: {
    label: 'Bank Passbook',
    category: 'identity',
    description: 'Bank account passbook (front page showing account holder details)',
    icon: '🏦',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  marksheet_10th: {
    label: '10th Marksheet',
    category: 'education',
    description: 'Class 10 board examination marksheet / certificate',
    icon: '📄',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  marksheet_12th: {
    label: '12th Marksheet',
    category: 'education',
    description: 'Class 12 board examination marksheet / certificate',
    icon: '📄',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  disability_certificate: {
    label: 'Disability Certificate / UDID',
    category: 'special',
    description: 'Unique Disability ID (UDID) or certified disability certificate',
    icon: '♿',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  land_records: {
    label: 'Land Holding Papers / RoR',
    category: 'special',
    description: 'Record of Rights (RoR), Khasra/Khata land ownership papers',
    icon: '🌾',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  ration_card: {
    label: 'Ration Card / BPL Card',
    category: 'income',
    description: 'BPL / Antyodaya / NFSA ration card for subsidized welfare schemes',
    icon: '🍚',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  birth_certificate: {
    label: 'Birth Certificate',
    category: 'special',
    description: 'Official birth certificate issued by municipal/panchayat authority',
    icon: '👶',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  student_bonafide: {
    label: 'Student Bonafide / School Certificate',
    category: 'education',
    description: 'Bonafide certificate or school/college enrollment ID',
    icon: '🎓',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  employment_certificate: {
    label: 'Employment / Vending Certificate',
    category: 'education',
    description: 'Town vending committee certificate or employer bonafide',
    icon: '💼',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  address_proof: {
    label: 'Address / Residence Proof',
    category: 'identity',
    description: 'Utility bill, voter card, or proof of residence',
    icon: '📮',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  bpl_ews_certificate: {
    label: 'BPL / EWS Certificate',
    category: 'income',
    description: 'Economically Weaker Section or Below Poverty Line certificate',
    icon: '🏷️',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  widow_certificate: {
    label: 'Widow Certificate',
    category: 'special',
    description: 'Widow pension / death certificate of spouse',
    icon: '📜',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  affidavit: {
    label: 'Affidavit / Self Declaration',
    category: 'special',
    description: 'Notarized affidavit or statutory self-declaration',
    icon: '🖋️',
    acceptedFormats: 'PDF, JPG, PNG'
  },
  other: {
    label: 'Other Supporting Documents',
    category: 'special',
    description: 'Any other scheme-specific supporting document',
    icon: '📁',
    acceptedFormats: 'PDF, JPG, PNG'
  }
};

const STATUS_CONFIG = {
  Missing: { label: 'Not Uploaded', className: 'doc-status-missing', icon: '○' },
  Submitted: { label: 'Submitted', className: 'doc-status-submitted', icon: '⬆' },
  Processing: { label: 'Processing', className: 'doc-status-processing', icon: '⟳' },
  Processed: { label: 'Processed', className: 'doc-status-processed', icon: '✓' },
  'Needs Review': { label: 'Needs Review', className: 'doc-status-review', icon: '⚠' },
  Failed: { label: 'Processing Failed', className: 'doc-status-failed', icon: '✗' },
  Rejected: { label: 'Rejected', className: 'doc-status-failed', icon: '✗' }
};

export default function Documents() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingType, setUploadingType] = useState(null);
  const [uploadError, setUploadError] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null); // { url, mimeType, filename }
  const fileInputRefs = useRef({});

  async function loadDocuments() {
    try {
      setLoading(true);
      setError('');
      const res = await fetchUserDocuments(token);
      if (res.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      } else {
        setError(res.message || 'Failed to load documents.');
      }
    } catch (err) {
      console.error('Load documents error:', err);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadDocuments();
  }, [token]);

  const handleUploadClick = (docType) => {
    // Trigger hidden file input
    if (fileInputRefs.current[docType]) {
      fileInputRefs.current[docType].click();
    }
  };

  const handleFileChange = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset file input so same file can be re-uploaded
    e.target.value = '';

    // Client-side validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      setUploadError(prev => ({ ...prev, [docType]: 'Unsupported file type. Please use PDF, JPG, or PNG.' }));
      return;
    }
    if (file.size > maxSize) {
      setUploadError(prev => ({ ...prev, [docType]: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.` }));
      return;
    }

    setUploadingType(docType);
    setUploadError(prev => ({ ...prev, [docType]: '' }));
    setUploadSuccess(prev => ({ ...prev, [docType]: '' }));

    try {
      const res = await uploadDocument(file, docType, token);
      if (res.success) {
        setUploadSuccess(prev => ({ ...prev, [docType]: `${DOC_TYPE_INFO[docType]?.label || docType} uploaded successfully. Status: ${res.data?.status || 'Submitted'}` }));
        await loadDocuments();
      } else {
        setUploadError(prev => ({ ...prev, [docType]: res.message || 'Upload failed.' }));
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [docType]: err.message || 'Upload failed. Please try again.' }));
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (docId, docType) => {
    if (!window.confirm(`Are you sure you want to remove this ${DOC_TYPE_INFO[docType]?.label || docType}? You can re-upload it later.`)) return;
    setDeletingId(docId);
    try {
      const res = await deleteDocument(docId, token);
      if (res.success) {
        await loadDocuments();
      } else {
        setUploadError(prev => ({ ...prev, [docType]: res.message || 'Delete failed.' }));
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [docType]: err.message || 'Delete failed.' }));
    } finally {
      setDeletingId(null);
    }
  };

  const handleReprocess = async (docId, docType) => {
    setReprocessingId(docId);
    setUploadSuccess(prev => ({ ...prev, [docType]: '' }));
    try {
      const res = await reprocessDocument(docId, token);
      if (res.success) {
        setUploadSuccess(prev => ({ ...prev, [docType]: `Reprocessed. New status: ${res.data?.status || 'Updated'}` }));
        await loadDocuments();
      } else {
        setUploadError(prev => ({ ...prev, [docType]: res.message || 'Reprocessing failed.' }));
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [docType]: err.message || 'Reprocessing failed.' }));
    } finally {
      setReprocessingId(null);
    }
  };

  const handleViewDocument = async (docId, filename) => {
    try {
      const { blob, mimeType } = await viewDocument(docId, token);
      const url = URL.createObjectURL(blob);
      setViewingDoc({ url, mimeType: mimeType || 'application/pdf', filename });
    } catch (err) {
      alert(`Unable to load document: ${err.message}`);
    }
  };

  const closeViewer = () => {
    if (viewingDoc?.url) {
      URL.revokeObjectURL(viewingDoc.url);
    }
    setViewingDoc(null);
  };

  const getDocByType = (docType) => documents.find(d => d.doc_type === docType);

  const uploadedCount = documents.filter(d => d.status !== 'Missing' && d.id != null).length;

  if (loading) {
    return (
      <div className="civic-loader-container" style={{ padding: '60px 0' }}>
        <div className="civic-spinner" role="status" aria-label="Loading documents"></div>
        <p className="civic-loader-text">Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="documents-page-view">
      {/* Page Header */}
      <div className="documents-page-header">
        <div className="documents-header-content">
          <div className="section-tag-row">
            <h1 className="documents-page-title">My Documents</h1>
          </div>
          <p className="documents-page-desc">
            Upload and manage your identity and eligibility documents securely. Documents are stored privately and used only to assist your scheme eligibility evaluation.
          </p>
          <div className="doc-privacy-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Your documents are stored securely and accessible only to you. This is a portal-level document store — not connected to any government database.</span>
          </div>
        </div>

        <div className="doc-summary-stats">
          <div className="doc-stat-card">
            <span className="doc-stat-number">{uploadedCount}</span>
            <span className="doc-stat-label">Uploaded</span>
          </div>
          <div className="doc-stat-card">
            <span className="doc-stat-number">{Object.keys(DOC_TYPE_INFO).length - uploadedCount}</span>
            <span className="doc-stat-label">Pending</span>
          </div>
          <div className="doc-stat-card">
            <span className="doc-stat-number">{Object.keys(DOC_TYPE_INFO).length}</span>
            <span className="doc-stat-label">Total Types</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="civic-error-banner" style={{ marginBottom: '20px' }}>
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Document Cards Grid */}
      <div className="documents-grid">
        {Object.entries(DOC_TYPE_INFO).map(([docType, info]) => {
          const doc = getDocByType(docType);
          const status = doc?.status || 'Missing';
          const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG['Missing'];
          const isUploading = uploadingType === docType;
          const isDeleting = deletingId === doc?.id;
          const isReprocessing = reprocessingId === doc?.id;
          const hasUploadError = uploadError[docType];
          const hasUploadSuccess = uploadSuccess[docType];

          return (
            <div key={docType} className={`document-card ${status === 'Missing' ? 'doc-card-missing' : 'doc-card-uploaded'}`}>
              {/* Hidden file input */}
              <input
                type="file"
                ref={el => fileInputRefs.current[docType] = el}
                onChange={(e) => handleFileChange(e, docType)}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id={`file-input-${docType}`}
                aria-label={`Upload ${info.label}`}
              />

              {/* Card Header */}
              <div className="doc-card-header">
                <div className="doc-card-icon-wrap">
                  <span className="doc-card-icon" aria-hidden="true">{info.icon}</span>
                </div>
                <div className="doc-card-title-block">
                  <h3 className="doc-card-title">{info.label}</h3>
                  <p className="doc-card-desc">{info.description}</p>
                </div>
                <div className={`doc-status-badge ${statusConfig.className}`}>
                  <span className="doc-status-icon">{statusConfig.icon}</span>
                  <span className="doc-status-text">{statusConfig.label}</span>
                </div>
              </div>

              {/* Uploaded Document Info */}
              {doc && doc.id && (
                <div className="doc-card-file-info">
                  <div className="doc-file-details">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div>
                      <span className="doc-filename" title={doc.original_filename}>
                        {doc.original_filename?.length > 35 ? doc.original_filename.substring(0, 35) + '...' : doc.original_filename}
                      </span>
                      <span className="doc-filesize">{doc.file_size_kb} KB</span>
                    </div>
                  </div>
                  {doc.uploaded_at && (
                    <span className="doc-upload-date">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}

                  {/* Extracted Data Summary (safe fields only) */}
                  {doc.extracted_data && Object.keys(doc.extracted_data).length > 0 && (
                    <div className="doc-extracted-summary">
                      <span className="doc-extracted-label">Extracted Information:</span>
                      <div className="doc-extracted-fields">
                        {doc.extracted_data.name && (
                          <span className="doc-extracted-field">Name: {doc.extracted_data.name}</span>
                        )}
                        {doc.extracted_data.percentage && (
                          <span className="doc-extracted-field">Percentage: {doc.extracted_data.percentage}%</span>
                        )}
                        {doc.extracted_data.annual_income && (
                          <span className="doc-extracted-field">Annual Income: ₹{Number(doc.extracted_data.annual_income).toLocaleString('en-IN')}</span>
                        )}
                        {doc.extracted_data.category && (
                          <span className="doc-extracted-field">Category: {doc.extracted_data.category}</span>
                        )}
                        {doc.extracted_data.state && (
                          <span className="doc-extracted-field">State: {doc.extracted_data.state}</span>
                        )}
                        {doc.extracted_data.passing_year && (
                          <span className="doc-extracted-field">Passing Year: {doc.extracted_data.passing_year}</span>
                        )}
                        {doc.extracted_data.bank_name && (
                          <span className="doc-extracted-field">Bank: {doc.extracted_data.bank_name}</span>
                        )}
                        {doc.extracted_data.text_found === false && (
                          <span className="doc-extracted-field doc-extracted-warn">Text extraction not possible for this file</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Messages */}
              {hasUploadError && (
                <div className="doc-card-msg doc-card-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{hasUploadError}</span>
                </div>
              )}
              {hasUploadSuccess && (
                <div className="doc-card-msg doc-card-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{hasUploadSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="doc-card-actions">
                {/* Upload / Replace button */}
                <button
                  type="button"
                  className={`btn-doc-upload ${doc?.id ? 'btn-doc-replace' : 'btn-doc-new'}`}
                  onClick={() => handleUploadClick(docType)}
                  disabled={isUploading}
                  title={doc?.id ? `Replace ${info.label}` : `Upload ${info.label}`}
                >
                  {isUploading ? (
                    <>
                      <span className="doc-btn-spinner"></span>
                      Uploading...
                    </>
                  ) : doc?.id ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Replace
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload
                    </>
                  )}
                </button>

                {/* View button */}
                {doc?.id && (
                  <button
                    type="button"
                    className="btn-doc-view"
                    onClick={() => handleViewDocument(doc.id, doc.original_filename)}
                    title="View document"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View
                  </button>
                )}

                {/* Reprocess button for Needs Review / Failed */}
                {doc?.id && (doc.status === 'Needs Review' || doc.status === 'Failed') && (
                  <button
                    type="button"
                    className="btn-doc-reprocess"
                    onClick={() => handleReprocess(doc.id, docType)}
                    disabled={isReprocessing}
                    title="Retry document processing"
                  >
                    {isReprocessing ? 'Retrying...' : 'Retry Process'}
                  </button>
                )}

                {/* Delete button */}
                {doc?.id && (
                  <button
                    type="button"
                    className="btn-doc-delete"
                    onClick={() => handleDelete(doc.id, docType)}
                    disabled={isDeleting}
                    title="Remove document"
                  >
                    {isDeleting ? (
                      'Removing...'
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                        Remove
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="doc-card-footer">
                <span className="doc-formats-note">Accepted: {info.acceptedFormats} · Max 10 MB</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="documents-tips-section">
        <h2 className="doc-tips-title">Document Upload Guidelines</h2>
        <div className="doc-tips-grid">
          <div className="doc-tip-item">
            <span className="doc-tip-icon">📋</span>
            <div>
              <strong>Accepted Formats</strong>
              <p>Upload PDF, JPG, or PNG files. Keep files under 10 MB for best results.</p>
            </div>
          </div>
          <div className="doc-tip-item">
            <span className="doc-tip-icon">🔒</span>
            <div>
              <strong>Privacy & Security</strong>
              <p>Documents are stored securely and only accessible by you. Not shared externally.</p>
            </div>
          </div>
          <div className="doc-tip-item">
            <span className="doc-tip-icon">⚠️</span>
            <div>
              <strong>Portal Validation Only</strong>
              <p>This portal does not officially verify documents with government databases. Upload documents to assist eligibility evaluation within this portal.</p>
            </div>
          </div>
          <div className="doc-tip-item">
            <span className="doc-tip-icon">🔄</span>
            <div>
              <strong>Replace Documents</strong>
              <p>Upload a new document to replace an existing one. Old documents are deactivated automatically.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div
          className="doc-viewer-overlay"
          onClick={closeViewer}
          role="dialog"
          aria-modal="true"
          aria-label="Document Viewer"
        >
          <div className="doc-viewer-modal" onClick={e => e.stopPropagation()}>
            <div className="doc-viewer-header">
              <h3 className="doc-viewer-title">{viewingDoc.filename}</h3>
              <button
                type="button"
                className="doc-viewer-close"
                onClick={closeViewer}
                aria-label="Close document viewer"
              >
                ✕
              </button>
            </div>
            <div className="doc-viewer-body">
              {viewingDoc.mimeType?.startsWith('image/') ? (
                <img
                  src={viewingDoc.url}
                  alt={viewingDoc.filename}
                  className="doc-viewer-image"
                />
              ) : (
                <iframe
                  src={viewingDoc.url}
                  title={viewingDoc.filename}
                  className="doc-viewer-iframe"
                  aria-label="Document PDF viewer"
                />
              )}
            </div>
            <div className="doc-viewer-footer">
              <a
                href={viewingDoc.url}
                download={viewingDoc.filename}
                className="btn-doc-download"
              >
                Download Document
              </a>
              <button type="button" onClick={closeViewer} className="btn-doc-close-viewer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="documents-quick-links">
        <Link to="/eligibility" className="btn-doc-quicklink">
          Check Eligibility with Documents →
        </Link>
        <Link to="/schemes" className="btn-doc-quicklink btn-doc-quicklink-secondary">
          Browse Schemes →
        </Link>
      </div>
    </div>
  );
}
