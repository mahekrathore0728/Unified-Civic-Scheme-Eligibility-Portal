import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import logoImg from '../components/logogovt.jpeg';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export default function Signup() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = formData.full_name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email format (e.g. citizen@example.com).');
      return;
    }
    if (!formData.password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await registerUser({
        full_name: trimmedName,
        email: trimmedEmail,
        password: formData.password,
        confirm_password: formData.confirm_password
      });

      if (res.success && res.data) {
        setSuccessMessage('Registration successful! Redirecting to your portal home...');
        if (res.data.token && res.data.user) {
          login(res.data.user, res.data.token);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1200);
        } else {
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 1400);
        }
      } else {
        setErrorMessage(res.message || 'Registration failed. Please review your details.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMessage(err.message || 'Unable to connect to registration service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-outer-container">
      <div className="auth-box-card">
        {/* Portal Logo */}
        <div className="auth-logo-row">
          <img src={logoImg} alt="Portal Logo" className="auth-portal-logo" />
        </div>

        <h1 className="auth-main-heading">Create Citizen Account</h1>
        <p className="auth-sub-desc">
          Register to maintain your civic profile and check statutory scheme entitlements.
        </p>

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

        <form onSubmit={handleSubmit} className="auth-form-fields" noValidate>
          <div className="auth-input-group">
            <label htmlFor="full_name" className="auth-input-label">Full Name *</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="e.g. Ramesh Sharma"
              className="civic-text-field"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="email" className="auth-input-label">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. citizen@example.com"
              className="civic-text-field"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password" className="auth-input-label">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              className="civic-text-field"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="confirm_password" className="auth-input-label">Confirm Password *</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="civic-text-field"
              value={formData.confirm_password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn-auth-primary"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register Citizen Account'}
          </button>
        </form>

        <div className="auth-switch-prompt">
          <p>
            Already registered?{' '}
            <Link to="/login" className="auth-accent-link">
              Sign In to Citizen Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
