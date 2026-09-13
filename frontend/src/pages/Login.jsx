import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

export default function Login() {
  const [activeTab, setActiveTab] = useState('citizen');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const from = location.state?.from?.pathname || '/';

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

  const handleTabClick = (tab) => {
    if (tab === 'signup') {
      navigate('/signup');
      return;
    }

    setActiveTab(tab);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!formData.password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);

      const res = await loginUser({
        email: trimmedEmail,
        password: formData.password
      });

      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        navigate(from, { replace: true });
      } else {
        setErrorMessage(
          res.message || 'Login failed. Please verify your credentials.'
        );
      }
    } catch (err) {
      console.error('Login error:', err);

      setErrorMessage(
        err.message ||
          'Unable to connect to login server. Please verify backend is running.'
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
        Civic Portal Authentication
      </h1>

      <p className="civic-auth-subtitle">
        Access your government scheme tracker, saved applications,
        and document checklists.
      </p>

      <div className="civic-auth-card">
        {/* Auth Mode Tabs */}
        <div className="civic-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'citizen'}
            className={`auth-tab-btn ${
              activeTab === 'citizen' ? 'active' : ''
            }`}
            onClick={() => handleTabClick('citizen')}
          >
            Citizen Login
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={false}
            className="auth-tab-btn"
            onClick={() => handleTabClick('signup')}
          >
            Citizen Registration
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'admin'}
            className={`auth-tab-btn ${
              activeTab === 'admin' ? 'active' : ''
            }`}
            onClick={() => handleTabClick('admin')}
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
          {activeTab === 'admin' && (
            <div className="admin-notice-pill">
              <span>
                Departmental & Administrative Access Portal
              </span>
            </div>
          )}

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

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field-group">
              <label
                htmlFor="email"
                className="auth-field-label"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={
                  activeTab === 'admin'
                    ? 'admin@civic.gov.in'
                    : 'e.g. rahul@example.com'
                }
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
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="auth-field-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? 'Authenticating...'
                : activeTab === 'admin'
                ? 'Login to Administrative Portal'
                : 'Login to Citizen Portal'}
            </button>
          </form>

          <div className="auth-footer-links">
            <p>
              Do not have an account?{' '}
              <Link
                to="/signup"
                className="auth-link"
              >
                Register as a new Citizen
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}