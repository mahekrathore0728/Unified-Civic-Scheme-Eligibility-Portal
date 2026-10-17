import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logoutUser, fetchSavedSchemes, saveScheme, removeSavedScheme } from '../services/api';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'civic_portal_user';
const TOKEN_STORAGE_KEY = 'civic_portal_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  });

  const [savedSchemeIds, setSavedSchemeIds] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const isAuthenticated = Boolean(user && token);

  const loadSavedSchemeIds = useCallback(async (authToken) => {
    if (!authToken) {
      setSavedSchemeIds([]);
      return;
    }
    try {
      setSavedLoading(true);
      const res = await fetchSavedSchemes(authToken);
      if (res && res.success && Array.isArray(res.data)) {
        setSavedSchemeIds(res.data.map(s => Number(s.id)));
      }
    } catch (err) {
      console.warn('Could not load saved schemes in AuthProvider:', err);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadSavedSchemeIds(token);
    } else {
      setSavedSchemeIds([]);
    }
  }, [token, loadSavedSchemeIds]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, userToken);
    } catch (e) {
      console.warn('Could not persist auth to localStorage:', e);
    }
    loadSavedSchemeIds(userToken);
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch (err) {
        console.warn('Server logout error:', err);
      }
    }
    setUser(null);
    setToken(null);
    setSavedSchemeIds([]);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear auth in localStorage:', e);
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.warn('Could not update user in localStorage:', e);
      }
      return merged;
    });
  };

  const isSchemeSaved = useCallback((schemeId) => {
    if (!schemeId) return false;
    return savedSchemeIds.includes(Number(schemeId));
  }, [savedSchemeIds]);

  const saveSchemeAction = async (schemeId) => {
    if (!token) throw new Error('Authentication required');
    const res = await saveScheme(schemeId, token);
    if (res.success) {
      setSavedSchemeIds(prev => Array.from(new Set([...prev, Number(schemeId)])));
    }
    return res;
  };

  const removeSchemeAction = async (schemeId) => {
    if (!token) throw new Error('Authentication required');
    const res = await removeSavedScheme(schemeId, token);
    if (res.success) {
      setSavedSchemeIds(prev => prev.filter(id => id !== Number(schemeId)));
    }
    return res;
  };

  const refreshSavedSchemes = () => {
    if (token) {
      return loadSavedSchemeIds(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        updateUser,
        savedSchemeIds,
        savedLoading,
        isSchemeSaved,
        saveSchemeAction,
        removeSchemeAction,
        refreshSavedSchemes
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}