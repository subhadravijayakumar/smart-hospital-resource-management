import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types.ts';
import { api, getStoredToken, setStoredToken } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  quickSwitchRole: (role: UserRole) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        const res = await api.getCurrentUser();
        setCurrentUser(res.user);
      } catch {
        // Fallback to demo admin if invalid
        setStoredToken(null);
        setCurrentUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<User> => {
    const res = await api.login(identifier, password);
    setStoredToken(res.token);
    setCurrentUser(res.user);
    return res.user;
  };

  const quickSwitchRole = async (role: UserRole): Promise<User> => {
    const res = await api.quickSwitchRole(role);
    setStoredToken(res.token);
    setCurrentUser(res.user);
    return res.user;
  };

  const logout = () => {
    setStoredToken(null);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setCurrentUser(res.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        quickSwitchRole,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
