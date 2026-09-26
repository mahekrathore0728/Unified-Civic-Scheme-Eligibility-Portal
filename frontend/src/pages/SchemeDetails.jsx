import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchSchemeById,
  fetchSavedSchemes,
  saveScheme,
  removeSavedScheme,
  checkSchemeEligibility,
  createApplication
} from '../services/api';

export default function SchemeDetails() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savePopup, setSavePopup] = useState(null); // { type, title, message }

  // Eligibility evaluation state
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [evalError, setEvalError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  const showSavePopup = (type, title, message) => {
    setSavePopup({ type, title, message });
  };

  useEffect(() => {
    async function loadScheme() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchSchemeById(id);
        if (res.success && res.data) {
          setScheme(res.data);

          const token = localStorage.getItem('civic_portal_token');
          if (token) {
            try {
              const savedRes = await fetchSavedSchemes(token);
              if (savedRes.success && Array.isArray(savedRes.data)) {
                const alreadySaved = savedRes.data.some(
                  (savedScheme) => Number(savedScheme.id) === Number(res.data.id)
                );
                setIsSaved(alreadySaved);
              }
            } catch (savedErr) {
              console.error('Failed to check saved scheme status:', savedErr);
            }
          }
        } else {
          setError(res.message || 'Scheme not found');
        }
      } catch (err) {
        console.error('Failed to load scheme details:', err);
        setError('Unable to load scheme details. Please check if the backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    loadScheme();
  }, [id]);

  async function handleSaveToggle() {
    const token = localStorage.getItem('civic_portal_token');

    if (!token) {
      showSavePopup('info', 'Login Required', 'Please login to save schemes to your profile.');
      return;
    }

    try {
      setSaveLoading(true);

      if (isSaved) {
        const res = await removeSavedScheme(scheme.id, token);
        if (res.success) {
          setIsSaved(false);
          showSavePopup('info', 'Scheme Removed', 'This scheme has been removed from your Saved Schemes.');
        } else {
          showSavePopup('error', 'Unable to Remove', res.message || 'Unable to remove scheme. Please try again.');
        }
      } else {
        const res = await saveScheme(scheme.id, token);
        if (res.success) {
          setIsSaved(true);
          showSavePopup('success', '✓ Scheme Saved Successfully!', 'This scheme has been added to your Saved Schemes.');
        } else {
          showSavePopup('error', 'Unable to Save Scheme', res.message || 'Unable to save scheme. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to update saved scheme:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already')) {
        setIsSaved(true);
        showSavePopup('info', 'Scheme Already Saved', 'This scheme is already present in your saved schemes.');
      } else {
        showSavePopup('error', 'Unable to Save Scheme', msg || 'Unable to save scheme. Please try again.');
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleCheckEligibility() {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: { pathname: `/schemes/${id}` } } });
      return;
    }

    try {
      setEvaluating(true);
      setEvalError('');
      const res = await checkSchemeEligibility(scheme.id, token);
      if (res.success && res.data) {
        setEvalResult(res.data);
      } else {
        setEvalError(res.message || 'Failed to evaluate eligibility.');
      }
    } catch (err) {
      console.error('Eligibility evaluation error:', err);
      setEvalError('Unable to evaluate eligibility. Please check backend server.');
    } finally {
      setEvaluating(false);
    }
  }

  async function handleStartApplication() {
    if (!token) {
      navigate('/login', { state: { from: { pathname: `/schemes/${id}` } } });
      return;
    }

    try {
      setApplying(true);
      setApplyError('');
      const res = await createApplication(scheme.id, token);
      if (res.success && res.data?.application_id) {
        navigate(`/applications/${res.data.application_id}`);
      } else {
        setApplyError(res.message || 'Unable to start application.');
      }
    } catch (err) {
      console.error('Start application error:', err);
      setApplyError(err.message || 'Failed to start application.');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="civic-loader-container" style={{ padding: '60px 0' }}>
        <div className="civic-spinner" role="status" aria-label="Loading scheme profile"></div>
        <p className="civic-loader-text">Loading scheme profile from database...</p>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="empty-schemes-notice" style={{ margin: '40px auto', maxWidth: '600px' }}>
        <h3 className="empty-title">Scheme Profile Unavailable</h3>
        <p className="empty-desc">{error || 'The requested scheme could not be located.'}</p>
        <Link to="/schemes" className="btn-filter-reset" style={{ display: 'inline-block', marginTop: '16px' }}>
          &larr; Return to Schemes Catalog
        </Link>
      </div>
    );
  }

  const isCentral = !scheme.state_requirement || scheme.state_requirement === 'All';
  const documentsList = scheme.required_documents
    ? scheme.required_documents.split(',').map((d) => d.trim())
    : [];

  return (
    <div className="scheme-details-view">
      {/* Navigation Breadcrumb */}
      <div className="details-breadcrumb">
        <Link to="/schemes" className="breadcrumb-link">
          &larr; Back to Schemes Catalog
        </Link>
      </div>

      <article className="details-main-card">
        {/* Header Block */}
        <header className="scheme-details-header">
          <div className="details-badges-bar">
            <span className="scheme-category-pill cat-badge-blue">{scheme.category}</span>
            <span className="scheme-category-pill cat-badge-default">
              {isCentral ? 'Central Sector Scheme' : `State: ${scheme.state_requirement}`}
            </span>
            <span className="scheme-category-pill cat-badge-green">
              Status: {scheme.status || 'Active'}
            </span>
          </div>

          <h1 className="scheme-details-title">{scheme.name}</h1>

          <div className="scheme-details-meta">
            <span>Application Deadline: <strong>{scheme.deadline || 'Ongoing / Open'}</strong></span>
          </div>
        </header>

        {/* 1. Scheme Overview */}
        <section className="details-info-section">
          <h2 className="details-section-heading">Scheme Overview</h2>
          <p className="details-paragraph">
            {scheme.description}
          </p>
        </section>

        {/* 2. Objective & Benefits */}
        <div className="details-twin-panels">
          <div className="panel-box panel-objective">
            <h3 className="panel-title text-navy">Primary Objective</h3>
            <p className="panel-text">
              {scheme.objective || 'To provide welfare and economic assistance to qualifying beneficiaries.'}
            </p>
          </div>

          <div className="panel-box panel-benefits">
            <h3 className="panel-title text-green">Benefits &amp; Entitlements</h3>
            <p className="panel-text">
              {scheme.benefits || 'Financial, economic, and welfare subsidies as notified by the governing department.'}
            </p>
          </div>
        </div>

        {/* 3. Eligibility Criteria */}
        <section className="details-info-section">
          <h2 className="details-section-heading">Eligibility Criteria</h2>
          <p className="details-subtext">
            {scheme.eligibility_rules || 'Beneficiaries must satisfy all standard demographic and socioeconomic qualifications listed below.'}
          </p>

          <div className="criteria-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Eligible Age Bracket</span>
              <span className="spec-value">{scheme.age_min} to {scheme.age_max} years</span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Annual Income Ceiling</span>
              <span className="spec-value">
                {scheme.income_limit ? `Up to ₹${scheme.income_limit.toLocaleString('en-IN')} / year` : 'No Income Cap'}
              </span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Gender Criteria</span>
              <span className="spec-value">
                {scheme.gender === 'All' ? 'All Genders Eligible' : scheme.gender}
              </span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Target Social Category</span>
              <span className="spec-value">
                {scheme.category_requirement === 'All' ? 'All Categories (Open)' : scheme.category_requirement}
              </span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Applicable State / Region</span>
              <span className="spec-value">
                {scheme.state_requirement === 'All' ? 'Pan-India (All States & UTs)' : scheme.state_requirement}
              </span>
            </div>

            <div className="spec-item">
              <span className="spec-label">Beneficiary Requirements</span>
              <span className="spec-value">
                {scheme.farmer_requirement && <div>&bull; Landholding Farmer</div>}
                {scheme.student_requirement && <div>&bull; Enrolled Student</div>}
                {scheme.disability_requirement && <div>&bull; Person with Disability (PwD)</div>}
                {!scheme.farmer_requirement && !scheme.student_requirement && !scheme.disability_requirement && (
                  <div>Standard Citizen Eligibility</div>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* 4. Required Documents */}
        <section className="details-info-section">
          <h2 className="details-section-heading">Required Documents</h2>
          <p className="details-subtext">
            Ensure you have valid copies of the following documents before applying:
          </p>

          <ul className="docs-checklist-grid">
            {documentsList.map((doc, idx) => (
              <li key={idx} className="doc-checklist-item">
                <span className="doc-check-symbol" aria-hidden="true">&#10003;</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Application Process */}
        <section className="details-info-section">
          <h2 className="details-section-heading">Application Process</h2>
          <p className="details-paragraph">
            {scheme.application_process || 'Applications must be submitted directly through the official government portal or registered Common Service Centres (CSCs).'}
          </p>
        </section>

        {/* 6. Official Portal Notice */}
        <div className="official-portal-banner" role="note">
          <div className="official-portal-text">
            <h4 className="official-banner-heading">Official Portal Link</h4>
            <p className="official-banner-desc">
              Applications are processed directly on the official ministerial website. Always verify statutory notifications on the authoritative portal.
            </p>
          </div>
          {scheme.official_portal_url && (
            <a
              href={scheme.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-visit-portal"
            >
              <span>Visit Official Portal </span>
            </a>
          )}
        </div>

        {/* Personalized Eligibility & Document Check Section */}
        <section className="scheme-eligibility-eval-section">
          <div className="eval-section-header">
            <div>
              <h2 className="details-section-heading">Personalized Eligibility &amp; Document Evaluation</h2>
              <p className="details-subtext">
                Evaluate this scheme against your saved citizen profile and uploaded document vault in real time.
              </p>
            </div>
            {!evalResult && (
              <button
                type="button"
                onClick={handleCheckEligibility}
                disabled={evaluating}
                className="btn-evaluate-scheme"
              >
                {evaluating ? 'Evaluating Profile & Documents...' : '✓ Evaluate My Eligibility'}
              </button>
            )}
          </div>

          {evalError && (
            <div className="eval-error-box" role="alert" style={{ marginTop: '16px' }}>
              <span>⚠ {evalError}</span>
            </div>
          )}

          {evalResult && (
            <div className="eval-results-container" style={{ marginTop: '20px' }}>
              {/* 1. Verdict Banner Header */}
              <div className={`eval-verdict-header verdict-${(evalResult.status_code || evalResult.verdict || '').toLowerCase().replace(/[^a-z]/g, '-')}`}>
                <div className="verdict-badge-box">
                  <div className="verdict-icon-lg">
                    {evalResult.verdict === 'ELIGIBLE' || evalResult.verdict === 'Eligible' ? '✓' :
                     evalResult.verdict === 'NOT ELIGIBLE' || evalResult.verdict === 'Not Eligible' ? '✗' : '⚠'}
                  </div>
                  <div className="verdict-text-group">
                    <h3>{evalResult.verdict}</h3>
                    <p>{evalResult.reason}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckEligibility}
                  disabled={evaluating}
                  className="btn-re-evaluate"
                  title="Re-run evaluation"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#0A2E50'
                  }}
                >
                  {evaluating ? 'Evaluating...' : '↻ Re-evaluate'}
                </button>
              </div>

              {/* 2. Information Sources */}
              {evalResult.information_sources && evalResult.information_sources.length > 0 && (
                <div className="eval-sources-bar">
                  <span className="eval-sources-label">Information Sources:</span>
                  {evalResult.information_sources.map((src, idx) => (
                    <span key={idx} className="eval-source-chip">
                      📁 {src}
                    </span>
                  ))}
                </div>
              )}

              {/* 3. Document Conflict / Discrepancy Alerts (Preserves both, flags conflict) */}
              {evalResult.conflicts && evalResult.conflicts.length > 0 && (
                <div className="eval-conflict-alert" role="alert">
                  <strong>⚠️ Profile &amp; Document Discrepancies Noted:</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    {evalResult.conflicts.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Criteria Evaluation (Satisfied vs Unmet vs Missing) */}
              <div className="eval-sections-grid">
                {/* Satisfied Criteria */}
                <div className="eval-box eval-box-matched">
                  <h4 className="eval-box-title">
                    <span className="item-check">✓</span>
                    Criteria Satisfied ({evalResult.matched_criteria?.length || 0})
                  </h4>
                  {evalResult.matched_criteria && evalResult.matched_criteria.length > 0 ? (
                    <ul className="eval-list">
                      {evalResult.matched_criteria.map((c, idx) => (
                        <li key={idx}>
                          <span className="item-check">✓</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>No satisfied criteria recorded.</p>
                  )}
                </div>

                {/* Unmet Criteria (if any) */}
                {evalResult.unmet_criteria && evalResult.unmet_criteria.length > 0 && (
                  <div className="eval-box eval-box-unmet">
                    <h4 className="eval-box-title">
                      <span className="item-cross">✗</span>
                      Unmet Criteria ({evalResult.unmet_criteria.length})
                    </h4>
                    <ul className="eval-list">
                      {evalResult.unmet_criteria.map((c, idx) => (
                        <li key={idx}>
                          <span className="item-cross">✗</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Criteria / Information (if any) */}
                {evalResult.missing_criteria && evalResult.missing_criteria.length > 0 && (
                  <div className="eval-box eval-box-missing">
                    <h4 className="eval-box-title">
                      <span className="item-warn">○</span>
                      Missing Information ({evalResult.missing_criteria.length})
                    </h4>
                    <ul className="eval-list">
                      {evalResult.missing_criteria.map((c, idx) => (
                        <li key={idx}>
                          <span className="item-warn">○</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 5. Required Documents Checklist for this Scheme */}
              <div className="scheme-doc-checklist-block" style={{ marginTop: '16px' }}>
                <div className="checklist-head">
                  <h4 style={{ margin: 0 }}>Required Supporting Documents</h4>
                  <span className="checklist-sub">
                    {evalResult.doc_checklist?.filter(d => d.present).length || 0} of {evalResult.doc_checklist?.length || 0} In Vault
                  </span>
                </div>

                <div className="scheme-checklist-items">
                  {evalResult.doc_checklist && evalResult.doc_checklist.map((item, idx) => (
                    <div key={idx} className={`scheme-checklist-row ${item.present ? 'row-present' : 'row-missing'}`}>
                      <span className="row-icon">{item.present ? '✓' : item.is_mandatory ? '✗' : '○'}</span>
                      <span className="row-label">{item.display_label}</span>
                      <span className={`row-tag ${item.is_mandatory ? 'tag-mandatory' : 'tag-optional'}`}>
                        {item.is_mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                      <span className={`row-status ${item.present ? 'status-ok' : 'status-missing'}`}>
                        {item.present ? 'Uploaded' : 'Missing'}
                      </span>
                      {!item.present && (
                        <Link to="/documents" className="row-link-upload">
                          Upload to Vault &rarr;
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Application Action Banner if Eligible */}
              {(evalResult.verdict === 'ELIGIBLE' || evalResult.verdict === 'Eligible') && (
                <div className="application-prompt-banner" style={{ marginTop: '20px' }}>
                  <div className="prompt-text">
                    <strong>Ready to Prepare Application:</strong>
                    <span>
                      {(!evalResult.missing_mandatory_docs || evalResult.missing_mandatory_docs.length === 0)
                        ? 'All mandatory criteria and documents are ready. You can start internal portal application tracking.'
                        : `You meet eligibility rules. Upload missing mandatory document(s) in your vault to complete submission.`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartApplication}
                    disabled={applying}
                    className="btn-start-app"
                  >
                    {applying ? 'Starting Application...' : '⚡ Start Application / Track Readiness'}
                  </button>
                </div>
              )}

              {applyError && (
                <div className="apply-error-notice" style={{ marginTop: '12px' }}>
                  <span>{applyError}</span>
                  <Link to="/applications" className="link-view-apps">View existing applications</Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="details-actions-bar">
          <Link
            to="/eligibility"
            className="btn-action-check-eligibility"
          >
            Check Your Eligibility For This Scheme
          </Link>

          <button
            type="button"
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className={`btn-action-save-scheme ${isSaved ? 'saved' : ''}`}
          >
            {saveLoading
              ? 'Saving...'
              : isSaved
                ? '✓ Saved Scheme'
                : '☆ Save Scheme'}
          </button>

          <Link
            to="/schemes"
            className="btn-action-browse-more"
          >
            Browse More Schemes
          </Link>
        </div>
      </article>

      {/* Centered Save Scheme Modal */}
      {savePopup && (
        <div
          className="save-popup-backdrop"
          onClick={() => setSavePopup(null)}
          role="dialog"
          aria-modal="true"
          aria-label={savePopup.title}
        >
          <div
            className={`save-popup-card popup-${savePopup.type}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="save-popup-icon-wrap" aria-hidden="true">
              {savePopup.type === 'success' && '✓'}
              {savePopup.type === 'info' && '🔖'}
              {savePopup.type === 'error' && '⚠'}
            </div>
            <h3 className="save-popup-title">{savePopup.title}</h3>
            <p className="save-popup-desc">{savePopup.message}</p>
            <div className="save-popup-actions">
              <button
                type="button"
                className="btn-save-popup-ok"
                onClick={() => setSavePopup(null)}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}