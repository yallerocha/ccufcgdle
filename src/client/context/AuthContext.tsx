'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setToken, clearToken } from '@/client/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  gender: string;
  role: string;
  entrySemester: string;
  favoriteLanguage: string;
  area: string;
  lab: string;
  likesCoffee: string;
  lastLogin: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  photoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await apiFetch('/api/auth/me');
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user context:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.token) setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erro ao fazer login.' };
      }
    } catch (error) {
      return { success: false, error: 'Erro de conexão com o servidor.' };
    }
  };

  const logout = async () => {
    // Stateless bearer auth: just drop the token client-side.
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
