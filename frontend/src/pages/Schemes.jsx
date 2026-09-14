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
    <div className="schemes-page-view">
      {/* Page Header */}
      <div className="schemes-header-section">
        <div className="section-tag-row">
          
          <h1 className="schemes-main-title">Explore Government Schemes</h1>
        </div>
        <p className="schemes-sub-desc">
          Discover central and state government welfare schemes, subsidy programs, and citizen entitlements.
        </p>
      </div>

      {/* Filter Toolbar Card */}
      <div className="schemes-filter-box" role="search" aria-label="Schemes search and filters">
        <form onSubmit={handleSearchSubmit} className="filter-first-row">
          <div className="search-field-col">
            <svg
              className="search-field-icon"
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
              className="schemes-text-input"
              placeholder="Search schemes by name, keyword, or benefits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="state-select-col">
            <select
              className="schemes-dropdown-select"
              value={selectedState}
              onChange={handleStateChange}
              aria-label="Filter by state or central"
            >
              <option value="All">All States</option>
              {INDIAN_STATES.filter((s) => s !== 'All').map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-filter-search">
            Search
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn-filter-reset"
            title="Reset all filters"
          >
            Reset
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="category-pills-row" role="group" aria-label="Category filter pills">
          <span className="pills-title">Category:</span>
          <div className="pills-list-wrapper">
            {CATEGORY_PILLS.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`scheme-pill-item ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="civic-error-banner" style={{ marginTop: '16px' }}>
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="civic-loader-container">
          <div className="civic-spinner" role="status" aria-label="Loading schemes"></div>
          <p className="civic-loader-text">Loading schemes from database...</p>
        </div>
      ) : !error && schemes.length === 0 ? (
        <div className="empty-schemes-notice">
          <h3 className="empty-title">No matching schemes found</h3>
          <p className="empty-desc">
            No government welfare schemes matched your search parameters. Try adjusting your keyword or selecting "All" categories.
          </p>
          <button type="button" className="btn-filter-reset" onClick={handleReset}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="schemes-card-catalog-grid">
          {schemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}
