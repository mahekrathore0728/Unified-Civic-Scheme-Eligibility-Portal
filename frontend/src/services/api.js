/**
 * REST API Client for Unified Civic Scheme & Eligibility Portal
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

/**
 * Helper to handle fetch responses and return JSON data.
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid JSON response from server'
  }));

  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`);
  }
  return data;
}

/**
 * Fetch list of welfare schemes with optional search, category, and state filters.
 */
export async function fetchSchemes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.append('q', filters.q);
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters.state && filters.state !== 'All') params.append('state', filters.state);
  if (filters.scope && filters.scope !== 'All') params.append('scope', filters.scope);

  const url = `${API_BASE_URL}/schemes?${params.toString()}`;
  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Fetch detailed scheme profile by ID.
 */
export async function fetchSchemeById(id) {
  const url = `${API_BASE_URL}/schemes/${id}`;
  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Fetch distinct scheme categories and counts.
 */
export async function fetchCategories() {
  const url = `${API_BASE_URL}/schemes/categories`;
  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Execute rule-based eligibility evaluation.
 */
export async function evaluateEligibility(citizenData) {
  const url = `${API_BASE_URL}/eligibility/check`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(citizenData)
  });
  return handleResponse(response);
}

/**
 * Check backend connection status.
 */
export async function checkBackendHealth() {
  const url = `${API_BASE_URL.replace('/api', '')}/`;
  const response = await fetch(url);
  return handleResponse(response);
}

/**
 * Register a new citizen user account.
 */
export async function registerUser(userData) {
  const url = `${API_BASE_URL}/auth/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return handleResponse(response);
}

/**
 * Login user with email and password credentials.
 */
export async function loginUser(credentials) {
  const url = `${API_BASE_URL}/auth/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  return handleResponse(response);
}

/**
 * Logout user session.
 */
export async function logoutUser(token) {
  const url = `${API_BASE_URL}/auth/logout`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers
  });
  return handleResponse(response);
}

/**
 * Fetch authenticated citizen's profile.
 */
export async function fetchUserProfile(token) {
  const url = `${API_BASE_URL}/profile`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Update authenticated citizen's profile.
 */
export async function updateUserProfile(profileData, token) {
  const url = `${API_BASE_URL}/profile`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  return handleResponse(response);
}

/**
 * Fetch all schemes saved by the authenticated user.
 */
export async function fetchSavedSchemes(token) {
  const url = `${API_BASE_URL}/saved`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Save a scheme for the authenticated user.
 */
export async function saveScheme(schemeId, token) {
  const url = `${API_BASE_URL}/saved`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      scheme_id: schemeId
    })
  });
  return handleResponse(response);
}

/**
 * Remove a scheme from the authenticated user's saved schemes.
 */
export async function removeSavedScheme(schemeId, token) {
  const url = `${API_BASE_URL}/saved/${schemeId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
}