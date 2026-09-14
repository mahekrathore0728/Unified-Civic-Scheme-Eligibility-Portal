import React, { useState } from 'react';
import SchemeCard from '../components/SchemeCard';
import { evaluateEligibility, fetchUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

const INDIAN_STATES = [
  'All',
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

const OCCUPATIONS = [
  'All',
  'Farmer',
  'Student',
  'Street Vendor / Self-Employed',
  'Business / Self-Employed',
  'Salaried / Private Sector',
  'Government Employee',
  'Daily Wage Worker',
  'Unemployed / Homemaker',
  'Retired / Senior Citizen'
];

const INITIAL_FORM_STATE = {
  age: '',
  gender: '',
  state: '',
  annual_income: '',
  category: '',
  occupation: '',
  student_status: false,
  farmer_status: false,
  disability_status: false
};

export default function EligibilityChecker() {
  const { token, isAuthenticated } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('eligible');

  const loadFromProfile = async () => {
    if (!token) return;
    try {
      setProfileLoading(true);
      setError(null);
      const res = await fetchUserProfile(token);
      if (res.success && res.data) {
        const p = res.data;
        setFormData({
          age: p.age !== null && p.age !== undefined ? String(p.age) : '',
          gender: p.gender || '',
          state: p.state || '',
          annual_income: p.annual_income !== null && p.annual_income !== undefined ? String(p.annual_income) : '',
          occupation: p.occupation || '',
          category: p.category || '',
          student_status: Boolean(p.student_status),
          farmer_status: Boolean(p.farmer_status),
          disability_status: Boolean(p.disability_status)
        });
      }
    } catch (err) {
      console.warn('Could not load profile into checker:', err);
      setError('Unable to load profile data. Please fill the criteria manually.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError(null);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setResults(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Strict validation of required fields
    if (!formData.age) {
      setError('Please enter applicant age in years.');
      return;
    }
    if (!formData.gender) {
      setError('Please select applicant gender.');
      return;
    }
    if (!formData.state) {
      setError('Please select state of residence / domicile.');
      return;
    }
    if (formData.annual_income === '') {
      setError('Please enter annual family income.');
      return;
    }
    if (!formData.category) {
      setError('Please select social category.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        state: formData.state,
        annual_income: parseFloat(formData.annual_income),
        occupation: formData.occupation || 'All',
        category: formData.category,
        student_status: Boolean(formData.student_status),
        farmer_status: Boolean(formData.farmer_status),
        disability_status: Boolean(formData.disability_status)
      };

      const res = await evaluateEligibility(payload);
      if (res.success && res.data) {
        setResults(res.data);
        setActiveTab(res.data.eligible.length > 0 ? 'eligible' : 'not_eligible');
      } else {
        setError(res.message || 'Eligibility evaluation failed.');
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
      setError('Failed to connect to eligibility engine. Please verify the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checker-page-view">
      {/* Page Header */}
      <div className="checker-page-heading-block">
        <div className="section-tag-row">
          
          <h1 className="checker-title">Deterministic Scheme Eligibility Checker</h1>
        </div>
        <p className="checker-subtitle">
          Enter your demographic and economic details below. Our deterministic rule engine compares your profile with statutory government criteria without any AI estimation.
        </p>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="checker-grid-layout">
        {/* Left Column: Citizen Criteria Form */}
        <div className="criteria-form-card">
          <div className="card-header-bar">
            <h2 className="card-header-title">Citizen Criteria Inputs</h2>
            {isAuthenticated && (
              <button
                type="button"
                className="btn-autofill-action"
                onClick={loadFromProfile}
                disabled={profileLoading}
                title="Autofill demographic values from your registered citizen profile"
              >
                {profileLoading ? 'Loading...' : 'Autofill from My Profile'}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="criteria-form-body">
            <div className="criteria-inputs-grid">
              {/* Age */}
              <div className="input-field-group">
                <label htmlFor="age" className="input-label">Age (Years) *</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="125"
                  required
                  placeholder="e.g. 24"
                  className="civic-text-field"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              {/* Gender */}
              <div className="input-field-group">
                <label htmlFor="gender" className="input-label">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className="civic-select-field"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="All">Any / All</option>
                </select>
              </div>

              {/* State of Residence */}
              <div className="input-field-group">
                <label htmlFor="state" className="input-label">State of Residence *</label>
                <select
                  id="state"
                  name="state"
                  required
                  className="civic-select-field"
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="">Select State</option>
                  <option value="All">Pan-India (Any State)</option>
                  {INDIAN_STATES.filter((st) => st !== 'All').map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Annual Family Income */}
              <div className="input-field-group">
                <label htmlFor="annual_income" className="input-label">Annual Family Income (INR) *</label>
                <input
                  id="annual_income"
                  name="annual_income"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="e.g. 180000"
                  className="civic-text-field"
                  value={formData.annual_income}
                  onChange={handleChange}
                />
              </div>

              {/* Social Category */}
              <div className="input-field-group">
                <label htmlFor="category" className="input-label">Social Category *</label>
                <select
                  id="category"
                  name="category"
                  required
                  className="civic-select-field"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Social Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              {/* Primary Occupation */}
              <div className="input-field-group">
                <label htmlFor="occupation" className="input-label">Primary Occupation</label>
                <select
                  id="occupation"
                  name="occupation"
                  className="civic-select-field"
                  value={formData.occupation}
                  onChange={handleChange}
                >
                  <option value="">Select Occupation (Optional)</option>
                  <option value="All">Any / Unspecified</option>
                  {OCCUPATIONS.filter((occ) => occ !== 'All').map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Specific Citizen Status Checkboxes */}
            <div className="special-status-box">
              <span className="status-box-title">Specific Citizen Status:</span>
              <div className="status-checkboxes-stack">
                <label className="checkbox-item-label">
                  <input
                    type="checkbox"
                    name="student_status"
                    checked={formData.student_status}
                    onChange={handleChange}
                    className="custom-checkbox"
                  />
                  <span>Active Student</span>
                </label>

                <label className="checkbox-item-label">
                  <input
                    type="checkbox"
                    name="farmer_status"
                    checked={formData.farmer_status}
                    onChange={handleChange}
                    className="custom-checkbox"
                  />
                  <span>Farmer / Landholder</span>
                </label>

                <label className="checkbox-item-label">
                  <input
                    type="checkbox"
                    name="disability_status"
                    checked={formData.disability_status}
                    onChange={handleChange}
                    className="custom-checkbox"
                  />
                  <span>Person with Disability (min 40% PwD)</span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="civic-error-banner" style={{ marginTop: '12px' }}>
                <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions-row">
              <button
                type="submit"
                className="btn-submit-eligibility"
                disabled={loading}
              >
                {loading ? 'Evaluating Rules...' : 'Check Eligibility'}
              </button>

              {(formData.age || formData.gender || formData.state || formData.annual_income || formData.category || formData.occupation || results) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-reset-eligibility"
                >
                  Reset Form
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Information Panel or Results Display */}
        <div className="checker-results-col">
          {!results ? (
            /* Pristine State */
            <div className="empty-ready-card">
              <div className="ready-shield-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h3 className="ready-card-title">Ready to Verify Eligibility</h3>
              <p className="ready-card-desc">
                Fill in your citizen demographic details on the left and click "Check Eligibility" to see the rule comparison against statutory schemes.
              </p>
            </div>
          ) : (
            /* Results State */
            <div className="results-display-card">
              {/* Evaluation Summary Header */}
              <div className="results-top-header">
                <div>
                  <h3 className="results-title-text">Evaluation Results</h3>
                  <p className="results-subtitle-text">Compared against statutory schemes in the portal database.</p>
                </div>

                <div className="results-stat-badges-row">
                  <div className="stat-pill-badge stat-eligible">
                    <span className="stat-value">{results.eligible_count}</span>
                    <span className="stat-tag">Eligible</span>
                  </div>
                  <div className="stat-pill-badge stat-unmet">
                    <span className="stat-value">{results.not_eligible_count}</span>
                    <span className="stat-tag">Unmet</span>
                  </div>
                  <div className="stat-pill-badge stat-total">
                    <span className="stat-value">{results.total_evaluated}</span>
                    <span className="stat-tag">Evaluated</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="results-tabs-header" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'eligible'}
                  className={`tab-toggle-button ${activeTab === 'eligible' ? 'active' : ''}`}
                  onClick={() => setActiveTab('eligible')}
                >
                  Qualifying Schemes ({results.eligible_count})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'not_eligible'}
                  className={`tab-toggle-button ${activeTab === 'not_eligible' ? 'active' : ''}`}
                  onClick={() => setActiveTab('not_eligible')}
                >
                  Criteria Not Matched ({results.not_eligible_count})
                </button>
              </div>

              {/* Tab Content List */}
              <div className="results-tab-content-area">
                {activeTab === 'eligible' ? (
                  results.eligible.length === 0 ? (
                    <div className="no-matches-notice">
                      <h4>No Qualifying Schemes Matched</h4>
                      <p>Based on the criteria entered, no schemes currently meet all statutory qualifications. Check the "Criteria Not Matched" tab to see specific requirements.</p>
                    </div>
                  ) : (
                    <div className="results-schemes-list">
                      {results.eligible.map((s) => (
                        <SchemeCard
                          key={s.id}
                          scheme={s}
                          isEligible={true}
                          customReason={s.eligibility_reason}
                        />
                      ))}
                    </div>
                  )
                ) : results.not_eligible.length === 0 ? (
                  <div className="no-matches-notice">
                    <h4>All Schemes Qualified</h4>
                    <p>Your profile satisfies criteria across all evaluated welfare schemes.</p>
                  </div>
                ) : (
                  <div className="results-schemes-list">
                    {results.not_eligible.map((s) => (
                      <SchemeCard
                        key={s.id}
                        scheme={s}
                        isEligible={false}
                        customReason={s.eligibility_reason}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
