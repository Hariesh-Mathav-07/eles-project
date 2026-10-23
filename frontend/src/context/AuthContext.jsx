import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setStoredToken, getStoredToken } from '../api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { role: 'student', label: 'Student (Alex Johnson)', email: 'student@eles.edu', password: 'Student@123' },
  { role: 'teacher', label: 'Teacher (Prof. Langdon)', email: 'teacher@eles.edu', password: 'Teacher@123' },
  { role: 'admin', label: 'Admin (System Admin)', email: 'admin@eles.edu', password: 'Admin@123' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.error("Session restoration failed:", err);
          setStoredToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setStoredToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (fullName, email, password) => {
    const data = await api.register(fullName, email, password);
    setStoredToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const quickLogin = async (role) => {
    const account = DEMO_ACCOUNTS.find(a => a.role === role);
    if (account) {
      return await login(account.email, account.password);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickLogin }}>
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
