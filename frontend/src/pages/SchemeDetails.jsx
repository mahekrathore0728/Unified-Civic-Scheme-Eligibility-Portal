import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchSchemeById,
  fetchSavedSchemes,
  saveScheme,
  removeSavedScheme
} from '../services/api';

export default function SchemeDetails() {
  const { id } = useParams();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
      setSaveMessage('Please login to save schemes.');
      return;
    }

    try {
      setSaveLoading(true);
      setSaveMessage('');

      if (isSaved) {
        const res = await removeSavedScheme(scheme.id, token);

        if (res.success) {
          setIsSaved(false);
          setSaveMessage('Scheme removed from saved schemes.');
        } else {
          setSaveMessage(res.message || 'Unable to remove scheme.');
        }
      } else {
        const res = await saveScheme(scheme.id, token);

        if (res.success) {
          setIsSaved(true);
          setSaveMessage('Scheme saved successfully.');
        } else {
          setSaveMessage(res.message || 'Unable to save scheme.');
        }
      }
    } catch (err) {
      console.error('Failed to update saved scheme:', err);
      setSaveMessage(err.message || 'Unable to update saved scheme.');
    } finally {
      setSaveLoading(false);
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

        {saveMessage && (
          <p
            className="save-scheme-message"
            role="status"
          >
            {saveMessage}
          </p>
        )}
      </article>
    </div>
  );
}