import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SchemeCard from '../components/SchemeCard';
import { fetchSchemes } from '../services/api';

const CATEGORIES = [
  {
    id: 'Education',
    title: 'Education',
    bgClass: 'icon-bg-blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
      </svg>
    )
  },
  {
    id: 'Employment',
    title: 'Employment',
    bgClass: 'icon-bg-orange',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    )
  },
  {
    id: 'Agriculture',
    title: 'Agriculture',
    bgClass: 'icon-bg-green',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20h10" />
        <path d="M10 20c0-4 2-7 2-10" />
        <path d="M12 10c2-3 5-4 8-4-1 4-3 7-8 7" />
        <path d="M12 6C9 3 5 3 4 4c0 4 3 6 8 6" />
      </svg>
    )
  },
  {
    id: 'Healthcare',
    title: 'Healthcare',
    bgClass: 'icon-bg-red',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="14" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    )
  },
  {
    id: 'Housing',
    title: 'Housing',
    bgClass: 'icon-bg-cyan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    id: 'Women & Child',
    title: 'Women & Child',
    bgClass: 'icon-bg-purple',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
];

export default function Home() {
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoading(true);
        const res = await fetchSchemes();
        if (res.success && res.data) {
          // Display first 3 schemes matching the 3-column reference
          setFeaturedSchemes(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading featured schemes:', err);
        setError('Unable to load schemes from the database. Ensure backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/schemes?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/schemes');
    }
  };

  const handleCategoryClick = (catId) => {
    navigate(`/schemes?category=${encodeURIComponent(catId)}`);
  };

  return (
    <div className="home-container">
      {/* 1. Full-Width Deep Navy Hero Section */}
      <section className="civic-hero-block" aria-label="Portal Introduction">
        <div className="civic-hero-inner">
          <div className="civic-hero-content-col">
            <div className="hero-eyebrow">
              
              <span className="eyebrow-text">Citizen Welfare &amp; Scheme Services</span>
            </div>

            <h1 className="hero-main-title">
              Find Government Schemes You're Eligible For
            </h1>

            <p className="hero-sub-text">
              Discover welfare schemes, check eligibility and explore government benefits in one place.
            </p>

            {/* Immediate Search Bar */}
            <form onSubmit={handleHeroSubmit} className="hero-search-wrapper">
              <div className="hero-search-input-box">
                <svg
                  className="search-mag-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="Search schemes by name, category or keyword..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="hero-search-btn">
                Search
              </button>
            </form>

            {/* Hero Action Buttons */}
            <div className="hero-cta-buttons">
              <Link to="/eligibility" className="btn-hero-saffron">
                Check Eligibility &rarr;
              </Link>
              <Link to="/schemes" className="btn-hero-outline">
                Explore All Schemes
              </Link>
            </div>
          </div>

          {/* Decorative Chakra / Graphic element on the right */}
          <div className="hero-graphic-col" aria-hidden="true">
            <div className="hero-chakra-watermark">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="chakra-svg">
                <circle cx="100" cy="100" r="90" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle cx="100" cy="100" r="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="100" cy="100" r="10" fill="rgba(255,255,255,0.18)" />
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 360) / 24;
                  return (
                    <line
                      key={i}
                      x1="100"
                      y1="100"
                      x2="100"
                      y2="15"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="2"
                      transform={`rotate(${angle} 100 100)`}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="hero-wave-accent"></div>
          </div>
        </div>

        {/* Hero Bottom 3 Feature Highlights */}
        <div className="hero-features-bar">
          <div className="hero-feature-item">
            <div className="feature-icon-circle bg-blue-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21V14h6v7" />
              </svg>
            </div>
            <div className="feature-text-block">
              <span className="feature-title">Central &amp; State Schemes</span>
              <span className="feature-desc">Access schemes from both central and state governments</span>
            </div>
          </div>

          <div className="hero-feature-item">
            <div className="feature-icon-circle bg-green-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="feature-text-block">
              <span className="feature-title">Eligibility Based Search</span>
              <span className="feature-desc">Find schemes you're eligible for based on your profile</span>
            </div>
          </div>

          <div className="hero-feature-item">
            <div className="feature-icon-circle bg-purple-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="feature-text-block">
              <span className="feature-title">Official Links</span>
              <span className="feature-desc">Get direct links to official government portals for application</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (Clean Horizontal Process: 01 to 04) */}
      <section className="civic-section how-it-works-block" aria-labelledby="how-it-works-heading">
        <div className="section-heading-left">
          <div className="section-tag-row">
            
            <h2 id="how-it-works-heading" className="section-title-text">How It Works</h2>
          </div>
          <p className="section-subtitle-text">Get started in just a few simple steps</p>
        </div>

        <div className="horizontal-process-steps">
          {/* Step 01 */}
          <div className="process-step-item">
            <div className="step-header-row">
              <span className="step-number step-num-blue">01</span>
              <div className="step-icon-circle circle-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <h3 className="step-item-title">Create Profile</h3>
            <p className="step-item-desc">Register and add your basic details</p>
          </div>

          <div className="step-separator-arrow" aria-hidden="true">&rarr;</div>

          {/* Step 02 */}
          <div className="process-step-item">
            <div className="step-header-row">
              <span className="step-number step-num-green">02</span>
              <div className="step-icon-circle circle-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h3 className="step-item-title">Check Eligibility</h3>
            <p className="step-item-desc">Find schemes based on your profile and criteria</p>
          </div>

          <div className="step-separator-arrow" aria-hidden="true">&rarr;</div>

          {/* Step 03 */}
          <div className="process-step-item">
            <div className="step-header-row">
              <span className="step-number step-num-orange">03</span>
              <div className="step-icon-circle circle-orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
            </div>
            <h3 className="step-item-title">Review Scheme</h3>
            <p className="step-item-desc">View details, benefits and required documents</p>
          </div>

          <div className="step-separator-arrow" aria-hidden="true">&rarr;</div>

          {/* Step 04 */}
          <div className="process-step-item">
            <div className="step-header-row">
              <span className="step-number step-num-purple">04</span>
              <div className="step-icon-circle circle-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <h3 className="step-item-title">Track Status</h3>
            <p className="step-item-desc">Monitor your application status (when available)</p>
          </div>
        </div>
      </section>

      {/* 3. Explore Scheme Categories (Compact Horizontal Tiles) */}
      <section className="civic-section scheme-categories-block" aria-labelledby="categories-heading">
        <div className="section-header-split">
          <div>
            <div className="section-tag-row">
              
              <h2 id="categories-heading" className="section-title-text">Explore Scheme Categories</h2>
            </div>
            <p className="section-subtitle-text">Find schemes that match your needs and goals</p>
          </div>
          <Link to="/schemes" className="section-link-inline">
            View all schemes &rarr;
          </Link>
        </div>

        <div className="categories-tile-grid">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="category-pill-card"
              role="button"
              tabIndex="0"
              onClick={() => handleCategoryClick(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategoryClick(cat.id);
                }
              }}
            >
              <div className={`category-circle-icon ${cat.bgClass}`}>
                {cat.icon}
              </div>
              <span className="category-card-name">{cat.title}</span>
              <span className="category-card-arrow" aria-hidden="true">&rarr;</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Featured Government Schemes (Database-Driven, 3 Columns) */}
      <section className="civic-section featured-schemes-block" aria-labelledby="featured-heading">
        <div className="section-header-split">
          <div>
            <div className="section-tag-row">
              
              <h2 id="featured-heading" className="section-title-text">Featured Government Schemes</h2>
            </div>
            <p className="section-subtitle-text">Popular schemes for citizens across different sectors</p>
          </div>
          <Link to="/schemes" className="section-link-inline">
            View all schemes &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="civic-loader-container">
            <div className="civic-spinner" role="status" aria-label="Loading featured schemes"></div>
            <p className="civic-loader-text">Loading schemes from database...</p>
          </div>
        ) : error ? (
          <div className="civic-error-banner">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : (
          <div className="featured-cards-grid">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Before You Apply Information Strip */}
      <section className="before-you-apply-strip" aria-label="Important information before applying">
        <div className="strip-left-col">
          <div className="strip-info-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="strip-title">Before You Apply</h3>
            <p className="strip-subtitle">Check these details before submitting an application.</p>
          </div>
        </div>

        <div className="strip-right-col">
          <div className="strip-check-items">
            <div className="strip-check-item">
              <span className="check-mark-blue">&#10003;</span>
              <span>Eligibility criteria</span>
            </div>
            <div className="strip-check-item">
              <span className="check-mark-blue">&#10003;</span>
              <span>Required documents</span>
            </div>
            <div className="strip-check-item">
              <span className="check-mark-blue">&#10003;</span>
              <span>Application deadline</span>
            </div>
            <div className="strip-check-item">
              <span className="check-mark-blue">&darr;</span>
              <span>Official government portal</span>
            </div>
          </div>
          <p className="strip-disclaimer-note">
            (i) Scheme information can change. Always verify the latest details on the official government portal.
          </p>
        </div>
      </section>
    </div>
  );
}
