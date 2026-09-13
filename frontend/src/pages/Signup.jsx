import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';

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

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = formData.full_name.trim();
    const trimmedEmail = formData.email.trim();

    // Client-side field validations
    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage(
        'Please enter a valid email format (e.g. user@domain.com).'
      );
      return;
    }

    if (!formData.password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage(
        'Password must be at least 6 characters in length.'
      );
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage(
        'Password and Confirm Password do not match.'
      );
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
        setSuccessMessage(
          'Registration successful! Redirecting to your portal home...'
        );

        // Auto log in new user
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
        setErrorMessage(
          res.message ||
            'Registration failed. Please review your details.'
        );
      }
    } catch (err) {
      console.error('Signup error:', err);

      setErrorMessage(
        err.message ||
          'Unable to connect to registration service.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-auth-container">
      {/* Top Pillar Emblem */}
      <div className="civic-emblem-circle" aria-hidden="true">
        <svg
          className="civic-emblem-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0A2E50"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 20h20" />
          <path d="M4 20V10" />
          <path d="M8 20V10" />
          <path d="M12 20V10" />
          <path d="M16 20V10" />
          <path d="M20 20V10" />
          <path d="M12 4L2 10h20L12 4z" />
        </svg>
      </div>

      <h1 className="civic-auth-title">
        Civic Portal Registration
      </h1>

      <p className="civic-auth-subtitle">
        Create an account to save welfare schemes, manage eligibility
        preferences, and verify entitlements.
      </p>

      <div className="civic-auth-card">
        {/* Auth Mode Tabs */}
        <div className="civic-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={false}
            className="auth-tab-btn"
            onClick={() => navigate('/login')}
          >
            Citizen Login
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={true}
            className="auth-tab-btn active"
          >
            Citizen Registration
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={false}
            className="auth-tab-btn"
            onClick={() => navigate('/login')}
          >
            <svg
              className="tab-shield-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>

            <span>Admin Login</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="civic-auth-body">
          {errorMessage && (
            <div
              className="civic-error-banner"
              style={{ marginBottom: '18px' }}
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

              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="civic-success-banner"
              style={{ marginBottom: '18px' }}
            >
              <svg
                className="success-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>

              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field-group">
              <label
                htmlFor="full_name"
                className="auth-field-label"
              >
                Full Name *
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="e.g. Ramesh Sharma"
                className="auth-field-input"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div className="auth-field-group">
              <label
                htmlFor="email"
                className="auth-field-label"
              >
                Email Address *
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="e.g. citizen@example.com"
                className="auth-field-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="auth-field-group">
              <label
                htmlFor="password"
                className="auth-field-label"
              >
                Password *
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                className="auth-field-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="auth-field-group">
              <label
                htmlFor="confirm_password"
                className="auth-field-label"
              >
                Confirm Password *
              </label>

              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="auth-field-input"
                value={formData.confirm_password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? 'Registering Account...'
                : 'Register Citizen Account'}
            </button>
          </form>

          <div className="auth-footer-links">
            <p>
              Already registered?{' '}
              <Link
                to="/login"
                className="auth-link"
              >
                Sign In to Citizen Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}