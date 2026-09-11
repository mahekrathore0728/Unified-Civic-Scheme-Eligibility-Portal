import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

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

  // Redirect destination after successful login
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
      setErrorMessage('Password is required.');
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
        setErrorMessage(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Unable to connect to login server. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-badge">Citizen & Official Portal Access</span>
          <h1 className="auth-title">Citizen Login</h1>
          <p className="auth-subtitle">
            Sign in to access your citizen profile, check scheme eligibility, and view personalized welfare entitlements.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon" aria-hidden="true">&#9888;</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. citizen@example.com"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Authenticating...' : 'Login to Account &rarr;'}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Do not have an account yet?{' '}
            <Link to="/signup" style={{ color: 'var(--gov-blue)', fontWeight: 600 }}>
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
