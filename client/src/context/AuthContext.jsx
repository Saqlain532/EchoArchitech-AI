import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextObject';
import { authApi } from '../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('echo_auth_token') : null;
  });
  const [userRepos, setUserRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch repositories for connected GitHub account
  const loadUserRepos = useCallback(async (username) => {
    if (!username) {
      setUserRepos([]);
      return [];
    }
    try {
      const repos = await authApi.fetchUserRepos(username);
      setUserRepos(repos);
      return repos;
    } catch (err) {
      console.warn('[AuthContext]: Could not fetch repos for', username, err.message);
      return [];
    }
  }, []);

  // Restore authenticated session on mount if token exists
  useEffect(() => {
    let active = true;
    (async () => {
      const storedToken = localStorage.getItem('echo_auth_token');
      if (!storedToken) {
        if (active) setLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        if (active && userData) {
          setUser(userData);
          setToken(storedToken);
          if (userData.github?.username) {
            loadUserRepos(userData.github.username);
          }
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        localStorage.removeItem('echo_auth_token');
        if (active) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadUserRepos]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      if (result?.token && result?.user) {
        localStorage.setItem('echo_auth_token', result.token);
        setToken(result.token);
        setUser(result.user);
        if (result.user.github?.username) {
          loadUserRepos(result.user.github.username);
        }
        return result.user;
      }
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authApi.register(userData);
      if (result?.token && result?.user) {
        localStorage.setItem('echo_auth_token', result.token);
        setToken(result.token);
        setUser(result.user);
        if (result.user.github?.username) {
          loadUserRepos(result.user.github.username);
        }
        return result.user;
      }
    } finally {
      setLoading(false);
    }
  };

  // Direct GitHub sign-in/up
  const loginWithGithub = async (githubUsername) => {
    setLoading(true);
    try {
      const result = await authApi.loginWithGithub({ githubUsername });
      if (result?.token && result?.user) {
        localStorage.setItem('echo_auth_token', result.token);
        setToken(result.token);
        setUser(result.user);
        loadUserRepos(githubUsername);
        return result.user;
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('echo_auth_token');
    setUser(null);
    setToken(null);
    setUserRepos([]);
  };

  // Update profile handler
  const updateProfile = async (updates) => {
    try {
      const updated = await authApi.updateProfile(updates);
      setUser(updated);
      if (updates.githubUsername) {
        loadUserRepos(updates.githubUsername);
      }
      return updated;
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    userRepos,
    loading,
    login,
    register,
    loginWithGithub,
    logout,
    updateProfile,
    fetchRepos: loadUserRepos,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
