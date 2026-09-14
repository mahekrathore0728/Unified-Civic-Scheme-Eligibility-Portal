import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import logoImg from '../components/logogovt.jpeg';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
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
        setErrorMessage(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Unable to connect to login server. Please verify backend is running.');
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

        <h1 className="auth-main-heading">Citizen Login</h1>
        <p className="auth-sub-desc">
          Sign in to access your citizen profile and verify scheme eligibility.
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

        <form onSubmit={handleSubmit} className="auth-form-fields" noValidate>
          <div className="auth-input-group">
            <label htmlFor="email" className="auth-input-label">Email Address</label>
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
            <label htmlFor="password" className="auth-input-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="civic-text-field"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn-auth-primary"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="auth-switch-prompt">
          <p>
            Do not have an account yet?{' '}
            <Link to="/signup" className="auth-accent-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
