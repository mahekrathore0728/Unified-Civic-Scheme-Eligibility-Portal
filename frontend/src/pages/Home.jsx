import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SchemeCard from '../components/SchemeCard';
import { fetchSchemes } from '../services/api';

const CATEGORIES = [
  {
    id: 'Education',
    title: 'Education',
    subtitle: 'Scholarships, fee waivers & academic grants',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    )
  },
  {
    id: 'Employment',
    title: 'Employment',
    subtitle: 'Self-employment subsidies & apprenticeship programs',
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
    subtitle: 'Direct farmer income, credit & crop insurance',
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
    subtitle: 'Cashless hospital coverage & health assurance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.66l7.65-7.65.77-.78a5.4 5.4 0 0 0 0-7.65z" />
      </svg>
    )
  },
  {
    id: 'Housing',
    title: 'Housing',
    subtitle: 'Pucca home subsidies & credit-linked incentives',
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
    subtitle: 'Maternity, girl child welfare & savings schemes',
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
          setFeaturedSchemes(res.data.slice(0, 4));
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
    <div className="home-page-view">
      {/* Hero Banner Section */}
      <section className="civic-hero-section" aria-label="Portal introduction">
        <div className="civic-hero-content">
          <span className="civic-hero-pill">Citizen Welfare & Scheme Services</span>
          <h2 className="civic-hero-title">
            Find Government Schemes You're Eligible For
          </h2>
          <p className="civic-hero-description">
            Discover central and state government welfare initiatives, evaluate qualification criteria deterministically, and access statutory public benefits.
          </p>

          <form onSubmit={handleHeroSubmit} className="civic-hero-search-box">
            <input
              type="text"
              className="civic-hero-search-input"
              placeholder="Search schemes by name, keyword, or benefits..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
            />
            <button type="submit" className="civic-hero-search-btn">
              Search Schemes
            </button>
          </form>

          <div className="civic-hero-ctas">
            <Link to="/eligibility" className="btn btn-accent-hero">
              Check Eligibility &rarr;
            </Link>
            <Link to="/schemes" className="btn btn-outline-hero">
              Explore All Schemes
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - 4 Cards Sequence */}
      <section className="how-it-works-section" aria-labelledby="how-it-works-title">
        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="workflow-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="workflow-title">Create Profile</h3>
            <p className="workflow-desc">
              Enter your basic demographic, educational, and family income details.
            </p>
          </div>

          <div className="workflow-card">
            <div className="workflow-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="workflow-title">Check Eligibility</h3>
            <p className="workflow-desc">
              Our deterministic rule engine compares your profile with scheme requirements.
            </p>
          </div>

          <div className="workflow-card">
            <div className="workflow-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="workflow-title">Apply</h3>
            <p className="workflow-desc">
              Prepare your documents and follow official application links directly.
            </p>
          </div>

          <div className="workflow-card">
            <div className="workflow-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="workflow-title">Track</h3>
            <p className="workflow-desc">
              Monitor your application status from Saved to Under Review and Approved.
            </p>
          </div>
        </div>
      </section>

      {/* Explore Scheme Categories Section */}
      <section className="scheme-categories-section" aria-labelledby="categories-heading">
        <div className="section-center-header">
          <h2 id="categories-heading" className="section-main-heading">
            Explore Scheme Categories
          </h2>
          <p className="section-sub-heading">
            Browse through government welfare programs designed for various citizen sectors.
          </p>
        </div>

        <div className="categories-card-grid">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="category-tile-card"
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
              <div className="category-tile-icon-box">
                {cat.icon}
              </div>
              <h3 className="category-tile-title">{cat.title}</h3>
              <p className="category-tile-subtitle">{cat.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Schemes Section */}
      <section className="featured-schemes-section" aria-labelledby="featured-heading">
        <div className="featured-header-row">
          <div>
            <h2 id="featured-heading" className="featured-title">
              Featured Schemes
            </h2>
            <p className="featured-subtitle">
              Key welfare initiatives currently open for citizen applications.
            </p>
          </div>
          <Link to="/schemes" className="btn-view-all">
            View All &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="civic-loader-container">
            <div className="civic-spinner" role="status" aria-label="Loading featured schemes"></div>
            <p className="civic-loader-text">Loading welfare schemes from database...</p>
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
