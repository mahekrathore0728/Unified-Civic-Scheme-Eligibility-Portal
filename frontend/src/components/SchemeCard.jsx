import React from 'react';
import { Link } from 'react-router-dom';

export default function SchemeCard({ scheme, customReason = null, isEligible = null }) {
  const isCentral = !scheme.state_requirement || scheme.state_requirement === 'All';

  return (
    <article className="civic-scheme-card" aria-labelledby={`scheme-heading-${scheme.id}`}>
      <div className="card-top-row">
        <div className="card-badges-group">
          <span className="civic-badge badge-category">{scheme.category}</span>
          <span className={`civic-badge ${isCentral ? 'badge-central' : 'badge-state'}`}>
            {isCentral ? 'Central Scheme' : `State: ${scheme.state_requirement}`}
          </span>
          {isEligible !== null && (
            <span className={`civic-badge ${isEligible ? 'badge-eligible' : 'badge-ineligible'}`}>
              {isEligible ? 'Eligible' : 'Not Eligible'}
            </span>
          )}
        </div>
      </div>

      <h3 id={`scheme-heading-${scheme.id}`} className="civic-scheme-title">
        {scheme.name}
      </h3>

      <p className="civic-scheme-desc">
        {scheme.description}
      </p>

      {customReason && (
        <div className={`civic-reason-callout ${isEligible ? 'reason-matched' : 'reason-unmet'}`}>
          <span className="reason-label-text">
            {isEligible ? 'Qualification Met: ' : 'Unmet Requirement: '}
          </span>
          <span className="reason-body-text">{customReason}</span>
        </div>
      )}

      <div className="civic-criteria-tags">
        {(scheme.age_min > 0 || scheme.age_max < 100) && (
          <span className="criteria-chip">Age: {scheme.age_min} - {scheme.age_max} yrs</span>
        )}
        {scheme.income_limit && (
          <span className="criteria-chip">Max Income: ₹{(scheme.income_limit).toLocaleString('en-IN')}</span>
        )}
        {scheme.gender && scheme.gender !== 'All' && (
          <span className="criteria-chip">Gender: {scheme.gender}</span>
        )}
        {scheme.farmer_requirement ? (
          <span className="criteria-chip chip-farmer">
            Farmers Only
          </span>
        ) : null}
        {scheme.student_requirement ? (
          <span className="criteria-chip chip-student">
            Students Only
          </span>
        ) : null}
        {scheme.disability_requirement ? (
          <span className="criteria-chip chip-pwd">
            PwD Only
          </span>
        ) : null}
      </div>

      <div className="civic-card-footer">
        <div className="card-deadline-text">
          <span className="deadline-label">Deadline: </span>
          <span className="deadline-val">{scheme.deadline || 'Ongoing'}</span>
        </div>
        <Link to={`/schemes/${scheme.id}`} className="btn-view-scheme">
          View Details &rarr;
        </Link>
      </div>
    </article>
  );
}
