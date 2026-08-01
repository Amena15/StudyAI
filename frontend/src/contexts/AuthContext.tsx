import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '@/src/utils/storage';
import axios from 'axios';

import Constants from 'expo-constants';
const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const savedToken = await storage.secureGet('auth_token', null);
      const savedUser = await storage.getItem('user', null);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser as User);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    await storage.secureSet('auth_token', access_token);
    await storage.setItem('user', userData);
    setToken(access_token);
    setUser(userData);
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await axios.post(`${API_URL}/api/auth/signup`, { email, password, name });
    const { access_token, user: userData } = response.data;
    await storage.secureSet('auth_token', access_token);
    await storage.setItem('user', userData);
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    await storage.secureRemove('auth_token');
    await storage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}