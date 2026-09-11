import React, { useState } from 'react';
import SchemeCard from '../components/SchemeCard';
import { evaluateEligibility } from '../services/api';

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

export default function EligibilityChecker() {
  const [formData, setFormData] = useState({
    age: '24',
    gender: 'Male',
    state: 'Maharashtra',
    annual_income: '180000',
    occupation: 'Farmer',
    category: 'OBC',
    student_status: false,
    farmer_status: true,
    disability_status: false
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('eligible');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Demo Presets for quick professor presentation
  const applyPreset = (preset) => {
    if (preset === 'farmer') {
      setFormData({
        age: '38',
        gender: 'Male',
        state: 'Maharashtra',
        annual_income: '180000',
        occupation: 'Farmer',
        category: 'OBC',
        student_status: false,
        farmer_status: true,
        disability_status: false
      });
    } else if (preset === 'student') {
      setFormData({
        age: '17',
        gender: 'Female',
        state: 'Uttar Pradesh',
        annual_income: '120000',
        occupation: 'Student',
        category: 'SC',
        student_status: true,
        farmer_status: false,
        disability_status: false
      });
    } else if (preset === 'senior') {
      setFormData({
        age: '68',
        gender: 'Male',
        state: 'Rajasthan',
        annual_income: '90000',
        occupation: 'Retired / Senior Citizen',
        category: 'General',
        student_status: false,
        farmer_status: false,
        disability_status: false
      });
    } else if (preset === 'vendor') {
      setFormData({
        age: '32',
        gender: 'Male',
        state: 'Delhi',
        annual_income: '150000',
        occupation: 'Street Vendor / Self-Employed',
        category: 'General',
        student_status: false,
        farmer_status: false,
        disability_status: false
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        age: parseInt(formData.age, 10) || 0,
        gender: formData.gender,
        state: formData.state,
        annual_income: parseFloat(formData.annual_income) || 0,
        occupation: formData.occupation,
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
        setError(res.message || 'Evaluation failed.');
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
      setError('Failed to connect to eligibility engine. Please verify Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eligibility-page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'var(--primary-navy)', fontSize: '2rem', fontWeight: 700, marginBottom: '6px' }}>
          Rule-Based Civic Eligibility Checker
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Compare your citizen demographic profile against statutory scheme criteria stored in the database to instantly identify qualifying welfare entitlements.
        </p>
      </div>

      {/* Demo Persona Quick-Fill Toolbar */}
      <div style={{ backgroundColor: '#EEF2F6', padding: '12px 18px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
          Quick Test Presets (for viva demonstration):
        </span>
        <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => applyPreset('farmer')}>
          🌾 Farmer Persona
        </button>
        <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => applyPreset('student')}>
          🎓 SC Student Persona
        </button>
        <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => applyPreset('senior')}>
          👴 Senior Citizen Persona
        </button>
        <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => applyPreset('vendor')}>
          🛒 Street Vendor Persona
        </button>
      </div>

      <div className="eligibility-container">
        {/* Form Card */}
        <section className="checker-card" aria-label="Citizen demographic criteria form">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-navy)', fontWeight: 700, borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>
            Citizen Profile & Socioeconomic Parameters
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="age" className="form-label">Age (in years)*</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="125"
                  required
                  className="form-input"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 28"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">Gender*</label>
                <select
                  id="gender"
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="annual_income" className="form-label">Annual Family Income (₹)*</label>
                <input
                  id="annual_income"
                  name="annual_income"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  className="form-input"
                  value={formData.annual_income}
                  onChange={handleChange}
                  placeholder="e.g. 180000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="state" className="form-label">Domicile / Residence State*</label>
                <select
                  id="state"
                  name="state"
                  className="form-select"
                  value={formData.state}
                  onChange={handleChange}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st === 'All' ? 'Pan-India / Any' : st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">Social Category / Caste Group*</label>
                <select
                  id="category"
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="General">General (Unreserved)</option>
                  <option value="OBC">Other Backward Classes (OBC)</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="EWS">Economically Weaker Section (EWS)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="occupation" className="form-label">Primary Occupation*</label>
                <select
                  id="occupation"
                  name="occupation"
                  className="form-select"
                  value={formData.occupation}
                  onChange={handleChange}
                >
                  {OCCUPATIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Special Beneficiary Status Checkboxes */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
              <span className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                Specific Beneficiary Qualifications:
              </span>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    name="farmer_status"
                    className="checkbox-input"
                    checked={formData.farmer_status}
                    onChange={handleChange}
                  />
                  <span>Landholding Farmer</span>
                </label>

                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    name="student_status"
                    className="checkbox-input"
                    checked={formData.student_status}
                    onChange={handleChange}
                  />
                  <span>Currently Enrolled Student</span>
                </label>

                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    name="disability_status"
                    className="checkbox-input"
                    checked={formData.disability_status}
                    onChange={handleChange}
                  />
                  <span>Person with Disability (min 40% PwD)</span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '200px' }}>
                {loading ? 'Evaluating Rules...' : 'Check My Eligibility &rarr;'}
              </button>
            </div>
          </form>
        </section>

        {/* Error Feedback */}
        {error && (
          <div className="empty-state" style={{ borderColor: 'var(--error)' }}>
            <h3 className="empty-state-title" style={{ color: 'var(--error)' }}>Evaluation Notice</h3>
            <p className="empty-state-desc">{error}</p>
          </div>
        )}

        {/* Results Presentation */}
        {results && (
          <section className="results-section" aria-label="Eligibility assessment results">
            <div className="results-summary-banner">
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-navy)', fontWeight: 700 }}>
                  Eligibility Assessment Results
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Rule engine evaluated your inputs against all statutory schemes stored in MySQL.
                </p>
              </div>

              <div className="results-stats">
                <div className="result-stat-item">
                  <span className="result-stat-number" style={{ color: 'var(--indian-green)' }}>
                    {results.eligible_count}
                  </span>
                  <span className="result-stat-label">Eligible</span>
                </div>
                <div className="result-stat-item">
                  <span className="result-stat-number" style={{ color: 'var(--text-muted)' }}>
                    {results.not_eligible_count}
                  </span>
                  <span className="result-stat-label">Criteria Unmet</span>
                </div>
                <div className="result-stat-item">
                  <span className="result-stat-number" style={{ color: 'var(--primary-navy)' }}>
                    {results.total_evaluated}
                  </span>
                  <span className="result-stat-label">Evaluated</span>
                </div>
              </div>
            </div>

            {/* Result Tabs */}
            <div className="results-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'eligible'}
                className={`results-tab ${activeTab === 'eligible' ? 'active' : ''}`}
                onClick={() => setActiveTab('eligible')}
              >
                Qualifying Schemes ({results.eligible_count})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'not_eligible'}
                className={`results-tab ${activeTab === 'not_eligible' ? 'active' : ''}`}
                onClick={() => setActiveTab('not_eligible')}
              >
                Criteria Not Matched ({results.not_eligible_count})
              </button>
            </div>

            {/* Eligible Tab Content */}
            {activeTab === 'eligible' && (
              <div>
                {results.eligible.length === 0 ? (
                  <div className="empty-state">
                    <h3 className="empty-state-title">No Qualifying Schemes Matched</h3>
                    <p className="empty-state-desc">
                      Based on the criteria entered, no schemes currently meet all qualifications. Review the "Criteria Not Matched" tab to see which constraints disqualified your profile.
                    </p>
                  </div>
                ) : (
                  <div className="schemes-grid">
                    {results.eligible.map((s) => (
                      <SchemeCard
                        key={s.id}
                        scheme={s}
                        isEligible={true}
                        customReason={s.eligibility_reason}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Not Eligible Tab Content */}
            {activeTab === 'not_eligible' && (
              <div>
                {results.not_eligible.length === 0 ? (
                  <div className="empty-state">
                    <h3 className="empty-state-title">Great News!</h3>
                    <p className="empty-state-desc">You qualify for all evaluated schemes in the portal database.</p>
                  </div>
                ) : (
                  <div className="schemes-grid">
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
            )}
          </section>
        )}
      </div>
    </div>
  );
}
