import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rk_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('rk_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return data.user;
      } else {
        setAuthError(data.message || 'Login failed');
        setLoading(false);
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      setAuthError(error.message || 'Network error occurred');
      setLoading(false);
      throw error;
    }
  };

  const register = async (name, email, password, role, phone) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role, phone })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('rk_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return data.user;
      } else {
        setAuthError(data.message || 'Registration failed');
        setLoading(false);
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      setAuthError(error.message || 'Network error occurred');
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('rk_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    authError,
    login,
    register,
    logout,
    apiUrl: API_URL
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
