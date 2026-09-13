import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SchemeCard from '../components/SchemeCard';
import { fetchSchemes } from '../services/api';

const INDIAN_STATES = [
  'All',
  'Central (All India)',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

const CATEGORY_PILLS = [
  'All',
  'Education',
  'Agriculture',
  'Healthcare',
  'Housing',
  'Employment',
  'Women & Child'
];

export default function Schemes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialState = searchParams.get('state') || 'All';

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [activeSearch, setActiveSearch] = useState(initialQ);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Sync state if URL search params change
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const catParam = searchParams.get('category') || 'All';
    const stateParam = searchParams.get('state') || 'All';

    setSearchTerm(qParam);
    setActiveSearch(qParam);
    setSelectedCategory(catParam);
    setSelectedState(stateParam);
  }, [searchParams]);

  // Fetch schemes from database
  useEffect(() => {
    async function loadSchemes() {
      try {
        setLoading(true);
        setError(null);

        // Map state filter for API
        let apiState = selectedState;
        let apiScope = 'All';
        if (selectedState === 'Central (All India)') {
          apiScope = 'Central';
          apiState = 'All';
        } else if (selectedState !== 'All') {
          apiScope = 'State';
          apiState = selectedState;
        }

        const res = await fetchSchemes({
          q: activeSearch,
          category: selectedCategory,
          scope: apiScope,
          state: apiState
        });

        if (res.success && res.data) {
          setSchemes(res.data);
        } else {
          setError('Unable to load schemes from the database.');
        }
      } catch (err) {
        console.error('Failed to load schemes:', err);
        setError('Unable to load schemes from the database.');
      } finally {
        setLoading(false);
      }
    }

    loadSchemes();
  }, [activeSearch, selectedCategory, selectedState]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    updateUrlParams(searchTerm, selectedCategory, selectedState);
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    updateUrlParams(activeSearch, selectedCategory, newState);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    updateUrlParams(activeSearch, cat, selectedState);
  };

  const handleReset = () => {
    setSearchTerm('');
    setActiveSearch('');
    setSelectedCategory('All');
    setSelectedState('All');
    setSearchParams({});
  };

  const updateUrlParams = (q, cat, st) => {
    const params = {};
    if (q) params.q = q;
    if (cat && cat !== 'All') params.category = cat;
    if (st && st !== 'All') params.state = st;
    setSearchParams(params);
  };

  return (
    <div className="schemes-page-container">
      {/* Search & Filter Toolbar Card */}
      <div className="schemes-filter-card" role="search" aria-label="Schemes search and filters">
        {/* Row 1: Search Input, State Select, Search Btn, Reset Btn */}
        <form onSubmit={handleSearchSubmit} className="filter-input-row">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="schemes-search-field"
              placeholder="Search schemes by name, keyword, or benefits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="state-select-wrapper">
            <select
              className="schemes-state-select"
              value={selectedState}
              onChange={handleStateChange}
              aria-label="Filter by state"
            >
              <option value="All">All States</option>
              {INDIAN_STATES.filter((s) => s !== 'All').map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="schemes-search-btn">
            <svg
              className="btn-icon"
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
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="schemes-reset-btn"
            title="Clear all search filters"
          >
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Reset</span>
          </button>
        </form>

        {/* Row 2: Category Pills */}
        <div className="filter-pills-row" role="group" aria-label="Category filter pills">
          <div className="pills-label">
            <svg
              className="pills-label-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Category:</span>
          </div>

          <div className="pills-list">
            {CATEGORY_PILLS.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="civic-error-banner" style={{ marginTop: '20px' }}>
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="civic-loader-container">
          <div className="civic-spinner" role="status" aria-label="Loading schemes"></div>
          <p className="civic-loader-text">Loading schemes from database...</p>
        </div>
      ) : !error && schemes.length === 0 ? (
        <div className="empty-schemes-box">
          <h3 className="empty-title">No matching schemes found</h3>
          <p className="empty-desc">
            No government welfare schemes matched your search parameters. Try clearing your filters or searching with different keywords.
          </p>
          <button type="button" className="schemes-reset-btn" onClick={handleReset}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="schemes-grid" style={{ marginTop: '24px' }}>
          {schemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}
