import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchSavedSchemes,
  removeSavedScheme
} from '../services/api';

export default function SavedSchemes() {
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    async function loadSavedSchemes() {
      const token = localStorage.getItem('civic_portal_token');
      

      if (!token) {
        setError('Please login to view your saved schemes.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const res = await fetchSavedSchemes(token);

        if (res.success && Array.isArray(res.data)) {
          setSavedSchemes(res.data);
        } else {
          setError(res.message || 'Unable to load saved schemes.');
        }
      } catch (err) {
        console.error('Failed to load saved schemes:', err);
        setError(err.message || 'Unable to load saved schemes.');
      } finally {
        setLoading(false);
      }
    }

    loadSavedSchemes();
  }, []);

  async function handleRemove(schemeId) {
    const token = localStorage.getItem('civic_portal_token');

    if (!token) {
      setError('Please login to manage saved schemes.');
      return;
    }

    try {
      setRemovingId(schemeId);
      setError('');

      const res = await removeSavedScheme(schemeId, token);

      if (res.success) {
        setSavedSchemes((currentSchemes) =>
          currentSchemes.filter(
            (scheme) => Number(scheme.id) !== Number(schemeId)
          )
        );
      } else {
        setError(res.message || 'Unable to remove saved scheme.');
      }
    } catch (err) {
      console.error('Failed to remove saved scheme:', err);
      setError(err.message || 'Unable to remove saved scheme.');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div
        className="civic-loader-container"
        style={{ padding: '60px 0' }}
      >
        <div
          className="civic-spinner"
          role="status"
          aria-label="Loading saved schemes"
        ></div>

        <p className="civic-loader-text">
          Loading your saved schemes...
        </p>
      </div>
    );
  }

  return (
    <div className="schemes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Saved Schemes</h1>
          <p className="page-subtitle">
            View and manage the government schemes you have bookmarked.
          </p>
        </div>
      </div>

      {error && (
        <div className="empty-schemes-notice">
          <h3 className="empty-title">Unable to Load Saved Schemes</h3>
          <p className="empty-desc">{error}</p>
        </div>
      )}

      {!error && savedSchemes.length === 0 && (
        <div className="empty-schemes-notice">
          <h3 className="empty-title">No Saved Schemes Yet</h3>

          <p className="empty-desc">
            You have not bookmarked any government schemes yet.
            Browse the scheme catalog and save schemes you want to
            review later.
          </p>

          <Link
            to="/schemes"
            className="btn-filter-reset"
            style={{
              display: 'inline-block',
              marginTop: '16px'
            }}
          >
            Browse Schemes
          </Link>
        </div>
      )}

      {!error && savedSchemes.length > 0 && (
        <div className="schemes-grid">
          {savedSchemes.map((scheme) => (
            <article
              key={scheme.id}
              className="scheme-card"
            >
              <div className="scheme-card-header">
                <span className="scheme-category-pill cat-badge-blue">
                  {scheme.category}
                </span>

                <span className="scheme-category-pill cat-badge-green">
                  {scheme.status || 'Active'}
                </span>
              </div>

              <h2 className="scheme-card-title">
                {scheme.name}
              </h2>

              <p className="scheme-card-description">
                {scheme.description}
              </p>

              <div className="scheme-card-meta">
                <span>
                  {scheme.state_requirement === 'All'
                    ? 'Pan-India'
                    : scheme.state_requirement || 'All States'}
                </span>

                <span>
                  {scheme.deadline || 'Ongoing / Open'}
                </span>
              </div>

              <div className="scheme-card-actions">
                <Link
                  to={`/schemes/${scheme.id}`}
                  className="btn-action-check-eligibility"
                >
                  View Details
                </Link>

                <button
                  type="button"
                  onClick={() => handleRemove(scheme.id)}
                  disabled={removingId === scheme.id}
                  className="btn-action-browse-more"
                >
                  {removingId === scheme.id
                    ? 'Removing...'
                    : 'Remove Saved'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}