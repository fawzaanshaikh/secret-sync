import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'secretsync.auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { token, user } = JSON.parse(stored);
      setAuthToken(token);
      setUser(user);
    }
    setReady(true);
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user } = await api.login(username, password);
    setAuthToken(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    setUser(user);
  }, []);

  const setup = useCallback(async (username, password) => {
    const { token, user } = await api.setup(username, password);
    setAuthToken(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, setup, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
