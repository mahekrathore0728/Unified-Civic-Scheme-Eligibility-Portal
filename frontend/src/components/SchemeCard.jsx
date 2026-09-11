import React from 'react';
import { Link } from 'react-router-dom';

export default function SchemeCard({ scheme, customReason = null, isEligible = null }) {
  const isCentral = !scheme.state_requirement || scheme.state_requirement === 'All';

  return (
    <article className="scheme-card" aria-labelledby={`scheme-heading-${scheme.id}`}>
      <div className="scheme-card-header">
        <div className="scheme-badges-row">
          <span className="badge badge-category">{scheme.category}</span>
          <span className={`badge ${isCentral ? 'badge-scope-central' : 'badge-scope-state'}`}>
            {isCentral ? 'Central Scheme' : `State: ${scheme.state_requirement}`}
          </span>
          {isEligible !== null && (
            <span className={`badge ${isEligible ? 'badge-eligible' : 'badge-not-eligible'}`}>
              {isEligible ? 'Eligible' : 'Not Eligible'}
            </span>
          )}
        </div>
        <h3 id={`scheme-heading-${scheme.id}`} className="scheme-title">
          {scheme.name}
        </h3>
      </div>

      <div className="scheme-card-body">
        <p className="scheme-desc">{scheme.description}</p>

        {customReason && (
          <div className="eligibility-reason-box">
            <span className={isEligible ? 'reason-tag-matched' : 'reason-tag-unmet'}>
              {isEligible ? 'Criteria Met: ' : 'Reason: '}
            </span>
            {customReason}
          </div>
        )}

        <div className="scheme-criteria-chips">
          {(scheme.age_min > 0 || scheme.age_max < 100) && (
            <span className="chip">Age: {scheme.age_min} - {scheme.age_max} yrs</span>
          )}
          {scheme.income_limit && (
            <span className="chip">Max Income: ₹{(scheme.income_limit).toLocaleString('en-IN')}</span>
          )}
          {scheme.gender && scheme.gender !== 'All' && (
            <span className="chip">Gender: {scheme.gender}</span>
          )}
          {scheme.farmer_requirement ? (
            <span className="chip" style={{ borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }}>
              Farmers Only
            </span>
          ) : null}
          {scheme.student_requirement ? (
            <span className="chip" style={{ borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}>
              Students Only
            </span>
          ) : null}
          {scheme.disability_requirement ? (
            <span className="chip" style={{ borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }}>
              PwD Only
            </span>
          ) : null}
        </div>
      </div>

      <div className="scheme-card-footer">
        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
          Deadline: <strong>{scheme.deadline || 'Ongoing'}</strong>
        </span>
        <Link to={`/schemes/${scheme.id}`} className="btn btn-primary">
          View Details &rarr;
        </Link>
      </div>
    </article>
  );
}
