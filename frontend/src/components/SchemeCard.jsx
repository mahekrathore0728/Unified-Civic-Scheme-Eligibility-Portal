import React from 'react';
import { Link } from 'react-router-dom';

export default function SchemeCard({ scheme, customReason = null, isEligible = null }) {
  // Determine category badge color class
  const getCategoryClass = (category) => {
    switch (category?.toLowerCase()) {
      case 'education':
        return 'cat-badge-blue';
      case 'employment':
        return 'cat-badge-green';
      case 'healthcare':
        return 'cat-badge-red';
      case 'agriculture':
        return 'cat-badge-emerald';
      case 'housing':
        return 'cat-badge-cyan';
      case 'women & child':
        return 'cat-badge-purple';
      default:
        return 'cat-badge-default';
    }
  };

  // Helper for key benefit text
  const getKeyBenefit = () => {
    if (scheme.benefits) {
      // If benefits is long, pick the first sentence or up to 60 characters
      const firstSentence = scheme.benefits.split('.')[0];
      return firstSentence.length > 70 ? firstSentence.slice(0, 67) + '...' : firstSentence;
    }
    if (scheme.income_limit) {
      return `Financial support for families with income up to ₹${scheme.income_limit.toLocaleString('en-IN')}`;
    }
    return 'Financial and welfare assistance as notified by the government';
  };

  return (
    <article className="featured-scheme-card" aria-labelledby={`scheme-card-${scheme.id}`}>
      {/* Top Row: Category badge + Top-Right Arrow */}
      <div className="scheme-card-top-row">
        <div className="card-badge-row">
          <span className={`scheme-category-pill ${getCategoryClass(scheme.category)}`}>
            {scheme.category}
          </span>
          {isEligible !== null && (
            <span className={`scheme-eligibility-pill ${isEligible ? 'badge-is-eligible' : 'badge-is-unmet'}`}>
              {isEligible ? 'Eligible' : 'Not Eligible'}
            </span>
          )}
        </div>
        <Link to={`/schemes/${scheme.id}`} className="card-top-arrow" aria-label={`View ${scheme.name}`}>
          &rarr;
        </Link>
      </div>

      {/* Scheme Name */}
      <h3 id={`scheme-card-${scheme.id}`} className="card-scheme-name">
        <Link to={`/schemes/${scheme.id}`} className="card-scheme-name-link">
          {scheme.name}
        </Link>
      </h3>

      {/* Description */}
      <p className="card-scheme-description">
        {scheme.description}
      </p>

      {/* Reason Box (When checked in Eligibility Checker) */}
      {customReason && (
        <div className={`card-reason-notice ${isEligible ? 'reason-box-pass' : 'reason-box-fail'}`}>
          <span className="reason-bold-label">
            {isEligible ? 'Requirement Met: ' : 'Unmet Criteria: '}
          </span>
          <span>{customReason}</span>
        </div>
      )}

      {/* Key Benefit Highlight Box */}
      <div className="card-key-benefit-box">
        <div className="benefit-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="benefit-text-wrap">
          <span className="benefit-bold-tag">Key benefit: </span>
          <span className="benefit-content">{getKeyBenefit()}</span>
        </div>
      </div>

      {/* Footer Link */}
      <div className="card-footer-action">
        <Link to={`/schemes/${scheme.id}`} className="card-view-details-link">
          View details &rarr;
        </Link>
      </div>
    </article>
  );
}
