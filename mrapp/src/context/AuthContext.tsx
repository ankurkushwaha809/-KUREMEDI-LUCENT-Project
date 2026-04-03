import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/api/client';
import { getMe } from '@/src/api';

export type User = {
  _id: string;
  phone: string;
  name?: string;
  email?: string;
  referralCode?: string;
  role?: string;
  kyc?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'BLANK';
  isVerified?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'mrapp_auth_token';
const USER_KEY = 'mrapp_auth_user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveAuth = useCallback(async (newToken: string, newUser: User) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (e) {
      console.warn('Failed to save auth:', e);
    }
  }, []);

  const login = useCallback(
    async (newToken: string, newUser: User) => {
      await saveAuth(newToken, newUser);
    },
    [saveAuth]
  );

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    } catch (e) {
      console.warn('Failed to clear auth:', e);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const freshUser = await getMe();
      setUser(freshUser as User);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        await logout();
      } else {
        console.warn('Failed to refresh user:', err);
      }
    }
  }, [token, logout]);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          try {
            const freshUser = await getMe();
            if (freshUser?.role !== 'agent') {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              await SecureStore.deleteItemAsync(USER_KEY);
              delete api.defaults.headers.common['Authorization'];
              setToken(null);
              setUser(null);
            } else {
              setToken(storedToken);
              setUser(freshUser as User);
              await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
            }
          } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 403) {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              await SecureStore.deleteItemAsync(USER_KEY);
              delete api.defaults.headers.common['Authorization'];
              setToken(null);
              setUser(null);
            } else {
              const parsed = JSON.parse(storedUser) as User;
              setToken(storedToken);
              setUser(parsed);
            }
          }
        } else {
          setToken(null);
          setUser(null);
        }
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
