import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile, updateUserProfile } from '../services/api';

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

export default function Profile() {
  const { user, token, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'USER',
    age: '',
    gender: 'All',
    state: 'All',
    annual_income: '',
    occupation: 'All',
    category: 'General',
    student_status: false,
    farmer_status: false,
    disability_status: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        setLoading(true);
        setErrorMessage('');
        const res = await fetchUserProfile(token);
        if (res.success && res.data) {
          const d = res.data;
          setFormData({
            full_name: d.full_name || '',
            email: d.email || '',
            role: d.role || 'USER',
            age: d.age !== null && d.age !== undefined ? String(d.age) : '',
            gender: d.gender || 'All',
            state: d.state || 'All',
            annual_income: d.annual_income !== null && d.annual_income !== undefined ? String(d.annual_income) : '',
            occupation: d.occupation || 'All',
            category: d.category || 'General',
            student_status: Boolean(d.student_status),
            farmer_status: Boolean(d.farmer_status),
            disability_status: Boolean(d.disability_status)
          });
        } else {
          setErrorMessage(res.message || 'Could not load profile.');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setErrorMessage(err.message || 'Failed to connect to backend server.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        age: formData.age !== '' ? parseInt(formData.age, 10) : null,
        gender: formData.gender,
        state: formData.state,
        annual_income: formData.annual_income !== '' ? parseFloat(formData.annual_income) : null,
        occupation: formData.occupation,
        category: formData.category,
        student_status: Boolean(formData.student_status),
        farmer_status: Boolean(formData.farmer_status),
        disability_status: Boolean(formData.disability_status)
      };

      const res = await updateUserProfile(payload, token);
      if (res.success && res.data) {
        setSuccessMessage('Profile updated successfully! Your updated details are saved in the database.');
        updateUser({ full_name: res.data.full_name });
      } else {
        setErrorMessage(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMessage(err.message || 'An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="civic-loader-container" style={{ padding: '60px 0' }}>
        <div className="civic-spinner" role="status" aria-label="Loading profile"></div>
        <p className="civic-loader-text">Retrieving citizen profile from database...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      {/* Profile Top Banner */}
      <div className="profile-banner-card">
        <div className="banner-left">
          <div className="banner-title-row">
            <h1 className="profile-main-title">Citizen Profile & Socioeconomic Parameters</h1>
            <span className="profile-role-badge">Role: {formData.role}</span>
          </div>
          <p className="profile-subtitle">
            Maintain your demographic and income details to enable instant scheme eligibility evaluation across public welfare programs.
          </p>
        </div>

        <Link to="/eligibility" className="profile-eligibility-cta">
          Run Eligibility Check &rarr;
        </Link>
      </div>

      {errorMessage && (
        <div className="civic-error-banner" style={{ marginBottom: '20px' }}>
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="civic-success-banner" style={{ marginBottom: '20px' }}>
          <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="profile-form-card">
        <form onSubmit={handleSubmit}>
          {/* Section 1: Account Information */}
          <div className="profile-section-heading">Account Information</div>
          <div className="profile-fields-grid">
            <div className="profile-field-group">
              <label htmlFor="full_name" className="profile-field-label">
                Full Name <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="profile-field-input"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div className="profile-field-group">
              <label htmlFor="email" className="profile-field-label">
                Email Address (Primary Identity)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                className="profile-field-input profile-field-disabled"
                value={formData.email}
                title="Email is your registered account identifier and cannot be modified"
              />
              <span className="profile-field-hint">
                Registered citizen identifier
              </span>
            </div>
          </div>

          {/* Section 2: Demographic & Economic Criteria */}
          <div className="profile-section-heading" style={{ marginTop: '28px' }}>
            Demographic & Economic Criteria
          </div>
          <div className="profile-fields-grid">
            <div className="profile-field-group">
              <label htmlFor="age" className="profile-field-label">Age (in years)</label>
              <input
                id="age"
                name="age"
                type="number"
                min="0"
                max="130"
                className="profile-field-input"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 34"
              />
            </div>

            <div className="profile-field-group">
              <label htmlFor="gender" className="profile-field-label">Gender</label>
              <select
                id="gender"
                name="gender"
                className="profile-field-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="All">Not Specified / Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="profile-field-group">
              <label htmlFor="state" className="profile-field-label">State / Union Territory</label>
              <select
                id="state"
                name="state"
                className="profile-field-select"
                value={formData.state}
                onChange={handleChange}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'Pan-India (All States & UTs)' : st}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-field-group">
              <label htmlFor="annual_income" className="profile-field-label">Annual Family Income (₹)</label>
              <input
                id="annual_income"
                name="annual_income"
                type="number"
                min="0"
                step="1000"
                className="profile-field-input"
                value={formData.annual_income}
                onChange={handleChange}
                placeholder="e.g. 180000"
              />
            </div>

            <div className="profile-field-group">
              <label htmlFor="occupation" className="profile-field-label">Primary Occupation</label>
              <select
                id="occupation"
                name="occupation"
                className="profile-field-select"
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

            <div className="profile-field-group">
              <label htmlFor="category" className="profile-field-label">Social Category</label>
              <select
                id="category"
                name="category"
                className="profile-field-select"
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
          </div>

          {/* Section 3: Specific Beneficiary Status */}
          <div className="profile-section-heading" style={{ marginTop: '28px' }}>
            Specific Beneficiary Status
          </div>
          <div className="profile-checkbox-row">
            <label className="civic-checkbox-label">
              <input
                type="checkbox"
                name="farmer_status"
                className="civic-checkbox-input"
                checked={formData.farmer_status}
                onChange={handleChange}
              />
              <span>Landholding Farmer</span>
            </label>

            <label className="civic-checkbox-label">
              <input
                type="checkbox"
                name="student_status"
                className="civic-checkbox-input"
                checked={formData.student_status}
                onChange={handleChange}
              />
              <span>Currently Enrolled Student</span>
            </label>

            <label className="civic-checkbox-label">
              <input
                type="checkbox"
                name="disability_status"
                className="civic-checkbox-input"
                checked={formData.disability_status}
                onChange={handleChange}
              />
              <span>Person with Disability (min 40% PwD)</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="profile-actions-bar">
            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
            <Link to="/schemes" className="profile-browse-link">
              Browse Welfare Schemes
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
