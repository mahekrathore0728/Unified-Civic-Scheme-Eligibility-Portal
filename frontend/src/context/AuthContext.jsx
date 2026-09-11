import React, { createContext, useContext, useState, useEffect } from 'react';
import { logoutUser } from '../services/api';

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

  const isAuthenticated = Boolean(user && token);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, userToken);
    } catch (e) {
      console.warn('Could not persist auth to localStorage:', e);
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch (err) {
        // Continue clearing client state regardless of server response
        console.warn('Server logout error:', err);
      }
    }
    setUser(null);
    setToken(null);
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

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, updateUser }}>
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
