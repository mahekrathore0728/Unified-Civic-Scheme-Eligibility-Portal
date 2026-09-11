import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import SchemeCard from '../components/SchemeCard';
import { fetchSchemes } from '../services/api';

export default function Home() {
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoading(true);
        const res = await fetchSchemes();
        if (res.success && res.data) {
          // Take first 4 schemes as featured schemes from the MySQL database
          setFeaturedSchemes(res.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Error loading featured schemes:', err);
        setError('Unable to connect to schemes database. Ensure backend and MySQL are running.');
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleHeroSearch = (term) => {
    if (term) {
      navigate(`/schemes?q=${encodeURIComponent(term)}`);
    } else {
      navigate('/schemes');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="hero-section">
        <span className="hero-tag">Centralized Welfare Discovery</span>
        <h1 className="hero-title">Find Government Schemes You May Be Eligible For</h1>
        <p className="hero-desc">
          Discover welfare schemes, check eligibility, and keep track of your applications in one place.
        </p>

        <div style={{ maxWidth: '640px', margin: '0 auto 24px auto' }}>
          <SearchBar onSearch={handleHeroSearch} placeholder="Search schemes by name, sector, or keyword..." />
        </div>

        <div className="hero-actions">
          <Link to="/schemes" className="btn btn-primary">
            Browse All Schemes
          </Link>
          <Link to="/eligibility" className="btn btn-accent">
            Check Your Eligibility &rarr;
          </Link>
        </div>
      </section>

      {/* 3 Core System Pillars */}
      <section className="pillars-section" aria-labelledby="features-heading">
        <h2 id="features-heading" style={{ textAlign: 'center', marginBottom: '28px', color: 'var(--primary-navy)', fontSize: '1.6rem' }}>
          How Unified Civic Scheme Portal Assists Citizens
        </h2>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon" aria-hidden="true">&#128269;</div>
            <h3 className="pillar-title">Discover Schemes</h3>
            <p className="pillar-desc">
              Access consolidated information on welfare schemes across agriculture, health, education, housing, and social security.
            </p>
            <Link to="/schemes" style={{ color: 'var(--gov-blue)', fontWeight: 600, textDecoration: 'none' }}>
              Explore catalog &rarr;
            </Link>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" aria-hidden="true">&#9745;</div>
            <h3 className="pillar-title">Check Eligibility</h3>
            <p className="pillar-desc">
              Enter your basic demographic and socioeconomic details to instantly view which welfare programs match your profile.
            </p>
            <Link to="/eligibility" style={{ color: 'var(--gov-blue)', fontWeight: 600, textDecoration: 'none' }}>
              Run eligibility check &rarr;
            </Link>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon" aria-hidden="true">&#128203;</div>
            <h3 className="pillar-title">Track Applications</h3>
            <p className="pillar-desc">
              Keep records of your submitted application reference numbers, required document checklists, and official portal links.
            </p>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Official verification &bull; Document checklist
            </span>
          </div>
        </div>
      </section>

      {/* Featured Schemes Section */}
      <section className="featured-section" aria-labelledby="featured-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 id="featured-heading" style={{ color: 'var(--primary-navy)', fontSize: '1.5rem', fontWeight: 700 }}>
              Featured Government Welfare Schemes
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Actively available welfare schemes retrieved directly from the portal database.
            </p>
          </div>
          <Link to="/schemes" className="btn btn-secondary">
            View All Schemes &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner" role="status" aria-label="Loading featured schemes"></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading welfare schemes from MySQL database...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Backend Connection Notice</h3>
            <p className="empty-state-desc">{error}</p>
          </div>
        ) : (
          <div className="schemes-grid">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
