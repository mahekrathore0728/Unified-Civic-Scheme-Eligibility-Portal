import React, { useState, useEffect } from 'react';

export default function SearchBar({ initialValue = '', onSearch, placeholder = 'Search by scheme name, benefits, or objective...' }) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <form className="search-container" onSubmit={handleSubmit} role="search" aria-label="Scheme search">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          aria-label="Search schemes"
        />
      </div>
      {searchTerm && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClear}
          title="Clear search"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </form>
  );
}
