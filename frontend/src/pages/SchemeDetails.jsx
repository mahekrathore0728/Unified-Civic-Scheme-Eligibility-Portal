import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSchemeById } from '../services/api';

export default function SchemeDetails() {
  const { id } = useParams();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadScheme() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchSchemeById(id);
        if (res.success && res.data) {
          setScheme(res.data);
        } else {
          setError(res.message || 'Scheme not found');
        }
      } catch (err) {
        console.error('Failed to load scheme details:', err);
        setError('Unable to load scheme details. Please check if the server is running.');
      } finally {
        setLoading(false);
      }
    }
    loadScheme();
  }, [id]);

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
      <div className="empty-schemes-box" style={{ margin: '40px auto', maxWidth: '600px' }}>
        <h3 className="empty-title">Scheme Profile Unavailable</h3>
        <p className="empty-desc">{error || 'Scheme could not be located.'}</p>
        <Link to="/schemes" className="btn-view-scheme" style={{ marginTop: '16px', display: 'inline-block' }}>
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
      {/* Back Link */}
      <div className="breadcrumb-nav">
        <Link to="/schemes" className="breadcrumb-back-link">
          &larr; Back to Schemes Catalog
        </Link>
      </div>

      <article className="civic-details-container">
        {/* Header Block */}
        <header className="details-header-block">
          <div className="details-badges-row">
            <span className="civic-badge badge-category">{scheme.category}</span>
            <span className={`civic-badge ${isCentral ? 'badge-central' : 'badge-state'}`}>
              {isCentral ? 'Central Sector Scheme' : `State Scheme: ${scheme.state_requirement}`}
            </span>
            <span className="civic-badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
              Status: {scheme.status || 'Active'}
            </span>
          </div>
          <h1 className="details-scheme-title">{scheme.name}</h1>
          <p className="details-deadline-text">
            Application Deadline: <strong>{scheme.deadline || 'Ongoing / No Deadline'}</strong>
          </p>
        </header>

        {/* Section 1: Overview */}
        <section className="details-card-section">
          <h2 className="details-heading">Scheme Overview</h2>
          <p className="details-body-text">
            {scheme.description}
          </p>
        </section>

        {/* Section 2: Objectives & Benefits */}
        <div className="details-twin-grid">
          <div className="details-subcard card-objective">
            <h3 className="subcard-title" style={{ color: 'var(--gov-blue)' }}>
              Primary Objective
            </h3>
            <p className="subcard-text">
              {scheme.objective || 'To provide welfare and economic assistance to eligible beneficiaries.'}
            </p>
          </div>

          <div className="details-subcard card-benefits">
            <h3 className="subcard-title" style={{ color: 'var(--indian-green)' }}>
              Benefits & Entitlements
            </h3>
            <p className="subcard-text">
              {scheme.benefits || 'Financial and material assistance as notified by the governing department.'}
            </p>
          </div>
        </div>

        {/* Section 3: Eligibility Criteria Breakdown */}
        <section className="details-card-section">
          <h2 className="details-heading">Eligibility Criteria Breakdown</h2>
          <p className="details-helper-text">
            {scheme.eligibility_rules || 'Beneficiaries must satisfy all standard demographic and socioeconomic qualifications listed below.'}
          </p>

          <div className="criteria-metric-grid">
            <div className="criteria-metric-box">
              <span className="metric-box-label">Eligible Age Bracket</span>
              <span className="metric-box-val">{scheme.age_min} to {scheme.age_max} years</span>
            </div>

            <div className="criteria-metric-box">
              <span className="metric-box-label">Annual Income Ceiling</span>
              <span className="metric-box-val">
                {scheme.income_limit ? `Up to ₹${scheme.income_limit.toLocaleString('en-IN')} / year` : 'No Income Cap'}
              </span>
            </div>

            <div className="criteria-metric-box">
              <span className="metric-box-label">Gender Criteria</span>
              <span className="metric-box-val">
                {scheme.gender === 'All' ? 'All Genders Eligible' : scheme.gender}
              </span>
            </div>

            <div className="criteria-metric-box">
              <span className="metric-box-label">Target Social Category</span>
              <span className="metric-box-val">
                {scheme.category_requirement === 'All' ? 'All Categories (Open)' : scheme.category_requirement}
              </span>
            </div>

            <div className="criteria-metric-box">
              <span className="metric-box-label">Applicable State / Region</span>
              <span className="metric-box-val">
                {scheme.state_requirement === 'All' ? 'Pan-India (All States & UTs)' : scheme.state_requirement}
              </span>
            </div>

            <div className="criteria-metric-box">
              <span className="metric-box-label">Beneficiary Requirements</span>
              <span className="metric-box-val" style={{ fontSize: '0.88rem' }}>
                {scheme.farmer_requirement && <div>&bull; Landholding Farmer</div>}
                {scheme.student_requirement && <div>&bull; Enrolled Student</div>}
                {scheme.disability_requirement && <div>&bull; Person with Disability (PwD)</div>}
                {!scheme.farmer_requirement && !scheme.student_requirement && !scheme.disability_requirement && (
                  <div>Standard Citizen Entitlement</div>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Section 4: Required Documents Checklist */}
        <section className="details-card-section">
          <h2 className="details-heading">Required Documents Checklist</h2>
          <p className="details-helper-text">
            Ensure you have legible copies of the following documents prior to applying on the official portal:
          </p>

          <ul className="docs-list-grid">
            {documentsList.map((doc, idx) => (
              <li key={idx} className="doc-item">
                <span className="doc-check-icon" aria-hidden="true">&#10003;</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 5: Application Procedure */}
        <section className="details-card-section">
          <h2 className="details-heading">Application Procedure</h2>
          <p className="details-body-text">
            {scheme.application_process || 'Applications must be submitted through the authoritative official government portal or registered Common Service Centres (CSCs).'}
          </p>
        </section>

        {/* Authoritative Portal Notice */}
        <div className="authoritative-source-callout" role="note">
          <h4 className="callout-heading">Authoritative Portal Notice</h4>
          <p className="callout-desc">
            This portal is an independent civic information system. Official scheme notifications, rules, guidelines,
            and actual application submissions are managed solely by the designated government department.
          </p>
          {scheme.official_portal_url && (
            <a
              href={scheme.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-official-external"
            >
              <span>Visit Official Government Portal </span>
            </a>
          )}
        </div>

        {/* Action Controls */}
        <div className="details-actions-footer">
          <Link to="/eligibility" className="btn-details-check">
            Check If You Are Eligible For This Scheme &rarr;
          </Link>
          <Link to="/schemes" className="btn-details-browse">
            Browse More Schemes
          </Link>
        </div>
      </article>
    </div>
  );
}
