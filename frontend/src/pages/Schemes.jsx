import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import SchemeCard from '../components/SchemeCard';
import { fetchSchemes, fetchCategories } from '../services/api';

const INDIAN_STATES = [
  'All',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

export default function Schemes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedScope, setSelectedScope] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Sync state if URL search param changes
  useEffect(() => {
    if (urlQuery !== search) {
      setSearch(urlQuery);
    }
  }, [urlQuery]);

  // Fetch schemes whenever filters change
  useEffect(() => {
    async function loadSchemes() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchSchemes({
          q: search,
          category: selectedCategory,
          scope: selectedScope,
          state: selectedState
        });
        if (res.success && res.data) {
          setSchemes(res.data);
        }
      } catch (err) {
        console.error('Failed to load schemes:', err);
        setError('Could not connect to the schemes API. Please ensure the Flask backend is running.');
      } finally {
        setLoading(false);
      }
    }
    loadSchemes();
  }, [search, selectedCategory, selectedScope, selectedState]);

  const handleSearchSubmit = (term) => {
    setSearch(term);
    if (term) {
      setSearchParams({ q: term });
    } else {
      setSearchParams({});
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedScope('All');
    setSelectedState('All');
    setSearchParams({});
  };

  return (
    <div className="schemes-page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'var(--primary-navy)', fontSize: '2rem', fontWeight: 700, marginBottom: '6px' }}>
          Government Welfare Schemes Catalog
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Discover Central and State government welfare schemes, subsidy programs, and citizen entitlements.
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        initialValue={search}
        onSearch={handleSearchSubmit}
        placeholder="Search schemes by title, keywords, benefits..."
      />

      {/* Filter Toolbar */}
      <div className="filter-bar" role="region" aria-label="Scheme filters">
        <div className="filter-group">
          <label htmlFor="category-select" className="filter-label">Sector / Category:</label>
          <select
            id="category-select"
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories ({categories.reduce((acc, c) => acc + c.count, 0) || 'All'})</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="scope-select" className="filter-label">Scheme Jurisdiction:</label>
          <select
            id="scope-select"
            className="filter-select"
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
          >
            <option value="All">All Jurisdictions</option>
            <option value="Central">Central Sector Schemes</option>
            <option value="State">State Specific Schemes</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="state-select" className="filter-label">Target State:</label>
          <select
            id="state-select"
            className="filter-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st === 'All' ? 'All States & UTs' : st}
              </option>
            ))}
          </select>
        </div>

        {(search || selectedCategory !== 'All' || selectedScope !== 'All' || selectedState !== 'All') && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
            style={{ padding: '6px 14px', fontSize: '0.85rem', marginLeft: 'auto' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          Showing <strong>{schemes.length}</strong> active schemes in the database
        </p>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="loading-spinner-container">
          <div className="spinner" role="status" aria-label="Loading schemes"></div>
          <p style={{ color: 'var(--text-muted)' }}>Fetching schemes from database...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h3 className="empty-state-title">Connection Error</h3>
          <p className="empty-state-desc">{error}</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No matching schemes found</h3>
          <p className="empty-state-desc">
            We could not find any government schemes matching your current search criteria. Try adjusting your filters or keyword.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleResetFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="schemes-grid">
          {schemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}
