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
        // Update user state in context
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
      <div className="loading-spinner-container">
        <div className="spinner" role="status" aria-label="Loading profile"></div>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving citizen profile from database...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ color: 'var(--primary-navy)', fontSize: '1.9rem', fontWeight: 700 }}>
              Citizen Profile & Socioeconomic Parameters
            </h1>
            <span className="badge" style={{ backgroundColor: '#E0E7FF', color: '#3730A3', fontSize: '0.8rem' }}>
              Role: {formData.role}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Maintain your demographic and income details to ensure accurate scheme eligibility evaluations and entitlement discovery.
          </p>
        </div>

        <Link to="/eligibility" className="btn btn-accent" style={{ alignSelf: 'center' }}>
          Run Eligibility Check &rarr;
        </Link>
      </div>

      {errorMessage && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '20px' }}>
          <span className="alert-icon" aria-hidden="true">&#9888;</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert" style={{ marginBottom: '20px' }}>
          <span className="alert-icon" aria-hidden="true">&#10003;</span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="profile-card">
        <form onSubmit={handleSubmit}>
          <div className="profile-section-title">Account Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="full_name" className="form-label">
                Full Name <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="form-input"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address (Primary Identity)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                className="form-input disabled-input"
                value={formData.email}
                title="Email is your registered account identifier and cannot be modified"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Registered login identifier
              </span>
            </div>
          </div>

          <div className="profile-section-title" style={{ marginTop: '28px' }}>
            Demographic & Economic Criteria
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="age" className="form-label">Age (in years)</label>
              <input
                id="age"
                name="age"
                type="number"
                min="0"
                max="130"
                className="form-input"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 34"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="All">Not Specified / Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="state" className="form-label">State / Union Territory</label>
              <select
                id="state"
                name="state"
                className="form-select"
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

            <div className="form-group">
              <label htmlFor="annual_income" className="form-label">Annual Family Income (₹)</label>
              <input
                id="annual_income"
                name="annual_income"
                type="number"
                min="0"
                step="1000"
                className="form-input"
                value={formData.annual_income}
                onChange={handleChange}
                placeholder="e.g. 180000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="occupation" className="form-label">Primary Occupation</label>
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

            <div className="form-group">
              <label htmlFor="category" className="form-label">Social Category</label>
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
          </div>

          <div className="profile-section-title" style={{ marginTop: '28px' }}>
            Specific Beneficiary Status
          </div>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', padding: '8px 0 16px 0' }}>
            <label className="checkbox-group">
              <input
                type="checkbox"
                name="farmer_status"
                className="checkbox-input"
                checked={formData.farmer_status}
                onChange={handleChange}
              />
              <span style={{ fontWeight: 500 }}>Landholding Farmer</span>
            </label>

            <label className="checkbox-group">
              <input
                type="checkbox"
                name="student_status"
                className="checkbox-input"
                checked={formData.student_status}
                onChange={handleChange}
              />
              <span style={{ fontWeight: 500 }}>Currently Enrolled Student</span>
            </label>

            <label className="checkbox-group">
              <input
                type="checkbox"
                name="disability_status"
                className="checkbox-input"
                checked={formData.disability_status}
                onChange={handleChange}
              />
              <span style={{ fontWeight: 500 }}>Person with Disability (min 40% PwD)</span>
            </label>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '14px', flexWrap: 'wrap', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ minWidth: '180px' }}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
            <Link to="/schemes" className="btn btn-secondary">
              Browse Welfare Schemes
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
