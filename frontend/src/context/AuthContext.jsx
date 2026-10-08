import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = sessionStorage.getItem('scms_auth');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((token, user) => {
    const value = { token, user };
    sessionStorage.setItem('scms_auth', JSON.stringify(value));
    setAuth(value);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('scms_auth');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
