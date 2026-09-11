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
      <div className="loading-spinner-container">
        <div className="spinner" role="status" aria-label="Loading scheme profile"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading scheme profile from database...</p>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">Scheme Profile Unavailable</h3>
        <p className="empty-state-desc">{error || 'Scheme could not be located.'}</p>
        <Link to="/schemes" className="btn btn-primary">
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
      <div style={{ marginBottom: '18px' }}>
        <Link to="/schemes" style={{ color: 'var(--gov-blue)', textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem' }}>
          &larr; Back to Schemes Catalog
        </Link>
      </div>

      <article className="scheme-details-container">
        <header className="details-header">
          <div className="scheme-badges-row">
            <span className="badge badge-category">{scheme.category}</span>
            <span className={`badge ${isCentral ? 'badge-scope-central' : 'badge-scope-state'}`}>
              {isCentral ? 'Central Sector Scheme' : `State Scheme: ${scheme.state_requirement}`}
            </span>
            <span className="badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
              Status: {scheme.status}
            </span>
          </div>
          <h1 className="details-title">{scheme.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Application Deadline: <strong>{scheme.deadline || 'Ongoing / No Deadline'}</strong>
          </p>
        </header>

        {/* Section 1: Overview & Description */}
        <section className="details-section">
          <h2 className="details-section-title">Scheme Overview</h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
            {scheme.description}
          </p>
        </section>

        {/* Section 2: Objectives & Key Benefits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--gov-blue)', fontSize: '1.1rem', marginBottom: '8px', fontWeight: 700 }}>
              Primary Objective
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              {scheme.objective || 'To provide welfare and economic assistance to eligible beneficiaries.'}
            </p>
          </div>

          <div style={{ backgroundColor: '#F0FDF4', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0' }}>
            <h3 style={{ color: 'var(--indian-green)', fontSize: '1.1rem', marginBottom: '8px', fontWeight: 700 }}>
              Benefits & Entitlements
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#166534', lineHeight: 1.6 }}>
              {scheme.benefits || 'Financial and material assistance as notified by the governing department.'}
            </p>
          </div>
        </div>

        {/* Section 3: Eligibility Rules & Criteria */}
        <section className="details-section">
          <h2 className="details-section-title">Eligibility Criteria Breakdown</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '14px' }}>
            {scheme.eligibility_rules || 'Beneficiaries must satisfy all standard demographic and socioeconomic qualifications listed below.'}
          </p>

          <div className="criteria-grid">
            <div className="criteria-box">
              <div className="criteria-box-label">Eligible Age Bracket</div>
              <div className="criteria-box-value">
                {scheme.age_min} to {scheme.age_max} years
              </div>
            </div>

            <div className="criteria-box">
              <div className="criteria-box-label">Annual Income Ceiling</div>
              <div className="criteria-box-value">
                {scheme.income_limit ? `Up to ₹${scheme.income_limit.toLocaleString('en-IN')} / year` : 'No Income Cap'}
              </div>
            </div>

            <div className="criteria-box">
              <div className="criteria-box-label">Gender Criteria</div>
              <div className="criteria-box-value">
                {scheme.gender === 'All' ? 'All Genders Eligible' : scheme.gender}
              </div>
            </div>

            <div className="criteria-box">
              <div className="criteria-box-label">Target Social Category</div>
              <div className="criteria-box-value">
                {scheme.category_requirement === 'All' ? 'All Categories (Open)' : scheme.category_requirement}
              </div>
            </div>

            <div className="criteria-box">
              <div className="criteria-box-label">Applicable State / Region</div>
              <div className="criteria-box-value">
                {scheme.state_requirement === 'All' ? 'Pan-India (All States & UTs)' : scheme.state_requirement}
              </div>
            </div>

            <div className="criteria-box">
              <div className="criteria-box-label">Beneficiary Requirements</div>
              <div className="criteria-box-value" style={{ fontSize: '0.9rem' }}>
                {scheme.farmer_requirement && <div>&bull; Landholding Farmer</div>}
                {scheme.student_requirement && <div>&bull; Enrolled Student</div>}
                {scheme.disability_requirement && <div>&bull; Person with Disability (PwD)</div>}
                {!scheme.farmer_requirement && !scheme.student_requirement && !scheme.disability_requirement && (
                  <div>Standard Civic Beneficiary</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Required Documents Checklist */}
        <section className="details-section">
          <h2 className="details-section-title">Required Documents Checklist</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
            Ensure you have legible physical or digital copies of the following documents prior to applying on the official portal:
          </p>

          <ul className="docs-checklist">
            {documentsList.map((doc, idx) => (
              <li key={idx} className="docs-checklist-item">
                <span style={{ color: 'var(--indian-green)', fontWeight: 700 }} aria-hidden="true">&#10003;</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 5: Application Procedure */}
        <section className="details-section">
          <h2 className="details-section-title">Application Procedure</h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
            {scheme.application_process || 'Applications must be submitted through the authoritative official government portal or registered Common Service Centres (CSCs).'}
          </p>
        </section>

        {/* Authoritative Portal Notice */}
        <div className="official-portal-callout" role="note">
          <h4>Authoritative Source Notice</h4>
          <p>
            This portal is an independent civic information system. Official scheme notifications, rules, guidelines,
            and actual application submissions are managed solely by the designated government department.
          </p>
          <a
            href={scheme.official_portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: 'inline-flex' }}
          >
            Visit Official Portal ({new URL(scheme.official_portal_url).hostname}) &nearr;
          </a>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <Link to="/eligibility" className="btn btn-accent">
            Check If You Are Eligible For This Scheme &rarr;
          </Link>
          <Link to="/schemes" className="btn btn-secondary">
            Browse More Schemes
          </Link>
        </div>
      </article>
    </div>
  );
}
