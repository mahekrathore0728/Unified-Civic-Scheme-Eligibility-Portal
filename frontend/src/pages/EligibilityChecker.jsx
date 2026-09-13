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
          gender: p.gender && p.gender !== 'All' ? p.gender : 'Male',
          state: p.state || 'Maharashtra',
          annual_income:
            p.annual_income !== null && p.annual_income !== undefined
              ? String(p.annual_income)
              : '',
          occupation: p.occupation && p.occupation !== 'All' ? p.occupation : 'Student',
          category: p.category || 'General',
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

    // Form validations
    if (!formData.age) {
      setError('Please enter applicant age.');
      return;
    }

    if (!formData.gender) {
      setError('Please select applicant gender.');
      return;
    }

    if (!formData.state) {
      setError('Please select your state of residence.');
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
        setActiveTab(
          res.data.eligible.length > 0 ? 'eligible' : 'not_eligible'
        );
      } else {
        setError(res.message || 'Eligibility evaluation failed.');
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
      setError(
        'Failed to connect to eligibility engine. Please verify the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checker-page-container">
      {/* Page Header */}
      <div className="checker-page-header">
        <h1 className="checker-page-title">
          Deterministic Scheme Eligibility Checker
        </h1>

        <p className="checker-page-subtitle">
          Enter your demographic and economic details below. Our deterministic
          rule engine compares your profile with statutory government criteria
          without any AI estimation.
        </p>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="checker-two-column-layout">
        {/* Left Column: Citizen Criteria Inputs Form */}
        <div className="checker-input-card">
          <div className="checker-card-header-row">
            <h2 className="checker-card-title">
              Citizen Criteria Inputs
            </h2>

            {isAuthenticated && (
              <button
                type="button"
                className="btn-autofill-profile"
                onClick={loadFromProfile}
                disabled={profileLoading}
                title="Autofill demographic values from your registered citizen profile"
              >
                {profileLoading
                  ? 'Loading Profile...'
                  : 'Autofill from Profile'}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="checker-form">
            <div className="checker-form-grid">
              {/* Age */}
              <div className="checker-form-group">
                <label htmlFor="age" className="checker-field-label">
                  Age (Years) *
                </label>

                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="125"
                  required
                  placeholder="e.g. 22"
                  className="checker-field-input"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              {/* Gender */}
              <div className="checker-form-group">
                <label htmlFor="gender" className="checker-field-label">
                  Gender *
                </label>

                <select
                  id="gender"
                  name="gender"
                  required
                  className="checker-field-select"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* State of Residence */}
              <div className="checker-form-group">
                <label htmlFor="state" className="checker-field-label">
                  State of Residence *
                </label>

                <select
                  id="state"
                  name="state"
                  required
                  className="checker-field-select"
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="">Select State</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="All">Pan-India (Any State)</option>

                  {INDIAN_STATES
                    .filter(
                      (st) => st !== 'All' && st !== 'Maharashtra'
                    )
                    .map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                </select>
              </div>

              {/* Annual Family Income */}
              <div className="checker-form-group">
                <label
                  htmlFor="annual_income"
                  className="checker-field-label"
                >
                  Annual Family Income (INR) *
                </label>

                <input
                  id="annual_income"
                  name="annual_income"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="e.g. 180000"
                  className="checker-field-input"
                  value={formData.annual_income}
                  onChange={handleChange}
                />
              </div>

              {/* Social Category */}
              <div className="checker-form-group">
                <label
                  htmlFor="category"
                  className="checker-field-label"
                >
                  Social Category *
                </label>

                <select
                  id="category"
                  name="category"
                  required
                  className="checker-field-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              {/* Occupation */}
              <div className="checker-form-group">
                <label
                  htmlFor="occupation"
                  className="checker-field-label"
                >
                  Occupation
                </label>

                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  placeholder="Student"
                  className="checker-field-input"
                  value={formData.occupation}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Specific Citizen Status Checkbox Box */}
            <div className="status-checkboxes-box">
              <span className="status-box-heading">
                Specific Citizen Status:
              </span>

              <div className="checkboxes-row">
                <label className="civic-checkbox-label">
                  <input
                    type="checkbox"
                    name="student_status"
                    checked={formData.student_status}
                    onChange={handleChange}
                    className="civic-checkbox-input"
                  />
                  <span>Active Student</span>
                </label>

                <label className="civic-checkbox-label">
                  <input
                    type="checkbox"
                    name="farmer_status"
                    checked={formData.farmer_status}
                    onChange={handleChange}
                    className="civic-checkbox-input"
                  />
                  <span>Farmer / Landholder</span>
                </label>

                <label className="civic-checkbox-label">
                  <input
                    type="checkbox"
                    name="disability_status"
                    checked={formData.disability_status}
                    onChange={handleChange}
                    className="civic-checkbox-input"
                  />
                  <span>Person with Disability (PwD)</span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="civic-error-banner"
                style={{ marginTop: '16px' }}
              >
                <svg
                  className="error-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="checker-actions-row">
              <button
                type="submit"
                className="checker-submit-btn"
                disabled={loading}
              >
                {loading
                  ? 'Evaluating Eligibility Rules...'
                  : 'Check Eligibility'}
              </button>

              {(formData.age ||
                formData.gender ||
                formData.state ||
                formData.annual_income ||
                formData.category ||
                results) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="checker-reset-btn"
                >
                  Reset Form
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Information Panel or Results Display */}
        <div className="checker-results-column">
          {!results ? (
            /* Pristine State: Ready to Verify Eligibility */
            <div className="ready-to-verify-card">
              <div className="shield-icon-wrapper">
                <svg
                  className="shield-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1565C0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>

              <h3 className="ready-verify-title">
                Ready to Verify Eligibility
              </h3>

              <p className="ready-verify-desc">
                Fill in or verify your demographic details on the left and
                click "Check Eligibility" to see the rule comparison.
              </p>
            </div>
          ) : (
            /* Results State: Rule Comparison & Cards */
            <div className="evaluation-results-card">
              {/* Summary Stats */}
              <div className="results-header-box">
                <div>
                  <h3 className="results-main-title">
                    Evaluation Summary
                  </h3>

                  <p className="results-sub-text">
                    Evaluated against statutory schemes stored in the database.
                  </p>
                </div>

                <div className="results-metrics-badges">
                  <div className="metric-badge eligible-metric">
                    <span className="metric-num">
                      {results.eligible_count}
                    </span>
                    <span className="metric-lbl">Eligible</span>
                  </div>

                  <div className="metric-badge unmet-metric">
                    <span className="metric-num">
                      {results.not_eligible_count}
                    </span>
                    <span className="metric-lbl">Unmet</span>
                  </div>

                  <div className="metric-badge total-metric">
                    <span className="metric-num">
                      {results.total_evaluated}
                    </span>
                    <span className="metric-lbl">Evaluated</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="results-tabs-bar" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'eligible'}
                  className={`results-tab-button ${
                    activeTab === 'eligible' ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab('eligible')}
                >
                  Qualifying Schemes ({results.eligible_count})
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'not_eligible'}
                  className={`results-tab-button ${
                    activeTab === 'not_eligible' ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab('not_eligible')}
                >
                  Criteria Not Matched ({results.not_eligible_count})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="results-tab-content">
                {activeTab === 'eligible' ? (
                  results.eligible.length === 0 ? (
                    <div className="no-schemes-notice">
                      <h4>No Qualifying Schemes Matched</h4>

                      <p>
                        Based on the criteria entered, no schemes currently
                        meet all qualifications. Check the "Criteria Not
                        Matched" tab to see specific constraints.
                      </p>
                    </div>
                  ) : (
                    <div className="results-schemes-stack">
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
                  <div className="no-schemes-notice">
                    <h4>All Schemes Qualified</h4>

                    <p>
                      Your profile satisfies statutory criteria across all
                      evaluated schemes.
                    </p>
                  </div>
                ) : (
                  <div className="results-schemes-stack">
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