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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = formData.full_name.trim();
    const trimmedEmail = formData.email.trim();

    // 1. Client-side field validations
    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email format (e.g. user@domain.com).');
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
        // Auto log in new user
        if (res.data.token && res.data.user) {
          login(res.data.user, res.data.token);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1200);
        } else {
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 1500);
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
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-badge">Citizen Self-Registration</span>
          <h1 className="auth-title">Create Citizen Account</h1>
          <p className="auth-subtitle">
            Register to build your civic profile, track qualifying government benefits, and manage eligible welfare schemes.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon" aria-hidden="true">&#9888;</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" role="alert">
            <span className="alert-icon" aria-hidden="true">&#10003;</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="full_name" className="form-label">
              Full Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="e.g. Ramesh Sharma"
              className="form-input"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

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
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">
              Confirm Password <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="form-input"
              value={formData.confirm_password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Creating Account...' : 'Register Account &rarr;'}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Already have an active citizen account?{' '}
            <Link to="/login" style={{ color: 'var(--gov-blue)', fontWeight: 600 }}>
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
