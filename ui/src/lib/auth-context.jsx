import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, logoutUser, signupUser } from './api-stubs';

const AuthContext = createContext(null);

const SESSION_KEY = 'secretsync.session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSession = localStorage.getItem(SESSION_KEY);
    if (!hasSession) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password) {
        const { user: loggedInUser } = await loginUser(email, password);
        localStorage.setItem(SESSION_KEY, 'mock-jwt-token');
        setUser(loggedInUser);
        return loggedInUser;
      },
      async signup(name, email, password) {
        const { user: newUser } = await signupUser(name, email, password);
        localStorage.setItem(SESSION_KEY, 'mock-jwt-token');
        setUser(newUser);
        return newUser;
      },
      async logout() {
        await logoutUser();
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider.');
  return ctx;
}
