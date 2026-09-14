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
        setSuccessMessage('Profile updated successfully! Your details are saved.');
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
        <p className="civic-loader-text">Loading citizen profile from database...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-view">
      {/* Top Banner Card */}
      <div className="profile-header-card">
        <div className="header-text-side">
          <div className="section-tag-row">
            
            <h1 className="profile-page-title">Citizen Profile</h1>
          </div>
          <p className="profile-page-desc">
            Keep your personal and citizen details updated to discover schemes you qualify for.
          </p>
        </div>

        <Link to="/eligibility" className="btn-profile-checker-cta">
          Check Eligibility &rarr;
        </Link>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="civic-error-banner" style={{ marginBottom: '16px' }}>
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="civic-success-banner" style={{ marginBottom: '16px' }}>
          <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <div className="profile-form-container">
        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Information */}
          <div className="profile-form-section">
            <h2 className="profile-section-title">Personal Information</h2>
            <div className="profile-fields-grid">
              <div className="input-field-group">
                <label htmlFor="full_name" className="input-label">Full Name *</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="civic-text-field"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>

              <div className="input-field-group">
                <label htmlFor="email" className="input-label">Email Address (Registered Account)</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  className="civic-text-field disabled-field"
                  value={formData.email}
                  title="Your registered email address cannot be modified"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Citizen Information */}
          <div className="profile-form-section" style={{ marginTop: '24px' }}>
            <h2 className="profile-section-title">Citizen Information</h2>
            <div className="profile-fields-grid">
              <div className="input-field-group">
                <label htmlFor="age" className="input-label">Age (in years)</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="125"
                  placeholder="e.g. 28"
                  className="civic-text-field"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              <div className="input-field-group">
                <label htmlFor="gender" className="input-label">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  className="civic-select-field"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="All">Any / Unspecified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-field-group">
                <label htmlFor="state" className="input-label">State / Domicile</label>
                <select
                  id="state"
                  name="state"
                  className="civic-select-field"
                  value={formData.state}
                  onChange={handleChange}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st === 'All' ? 'Pan-India (Any State)' : st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-field-group">
                <label htmlFor="annual_income" className="input-label">Annual Family Income (INR)</label>
                <input
                  id="annual_income"
                  name="annual_income"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 180000"
                  className="civic-text-field"
                  value={formData.annual_income}
                  onChange={handleChange}
                />
              </div>

              <div className="input-field-group">
                <label htmlFor="occupation" className="input-label">Primary Occupation</label>
                <select
                  id="occupation"
                  name="occupation"
                  className="civic-select-field"
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

              <div className="input-field-group">
                <label htmlFor="category" className="input-label">Social Category</label>
                <select
                  id="category"
                  name="category"
                  className="civic-select-field"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Specific Status */}
          <div className="profile-form-section" style={{ marginTop: '24px' }}>
            <h2 className="profile-section-title">Specific Beneficiary Status</h2>
            <div className="profile-checkboxes-row">
              <label className="checkbox-item-label">
                <input
                  type="checkbox"
                  name="farmer_status"
                  checked={formData.farmer_status}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <span>Landholding Farmer</span>
              </label>

              <label className="checkbox-item-label">
                <input
                  type="checkbox"
                  name="student_status"
                  checked={formData.student_status}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <span>Currently Enrolled Student</span>
              </label>

              <label className="checkbox-item-label">
                <input
                  type="checkbox"
                  name="disability_status"
                  checked={formData.disability_status}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <span>Person with Disability (PwD)</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="profile-actions-strip">
            <button
              type="submit"
              className="btn-save-profile"
              disabled={saving}
            >
              {saving ? 'Saving Details...' : 'Save Changes'}
            </button>
            <Link to="/schemes" className="btn-profile-secondary">
              Browse Schemes
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
