'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUserData: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUserData: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const me = await apiRequest<any>('/auth/me');
      const userData: User = {
        id: me.id,
        name: me.name,
        username: me.username,
        email: me.email,
        role: me.role || 'employee',
        business_id: me.business_id,
        business_name: me.business?.name || 'My Business',
        currency: me.business?.currency || 'ETB',
        currency_symbol: me.business?.currency_symbol || 'Br'
      };
      setUser(userData);
      localStorage.setItem('bms_user', JSON.stringify(userData));
    } catch (err) {
      // ignore
    }
  };

  const updateUserData = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('bms_user', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const storedUser = localStorage.getItem('bms_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        await refreshUser();
      } catch (err) {
        removeAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiRequest<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    setAuthToken(res.access_token);
    const userData: User = {
      id: res.user.id,
      name: res.user.name,
      username: res.user.username,
      email: res.user.email,
      role: res.user.role || 'admin',
      business_id: res.user.business_id,
      business_name: res.user.business_name || 'My Business',
      currency: res.user.currency || 'ETB',
      currency_symbol: res.user.currency_symbol || 'Br'
    };
    setUser(userData);
    localStorage.setItem('bms_user', JSON.stringify(userData));
    if (userData.role === 'delivery') {
      router.push('/delivery');
    } else if (userData.role === 'employee') {
      router.push('/employee');
    } else {
      router.push('/dashboard');
    }
  };

  const register = async (formData: any) => {
    await apiRequest<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    // Redirect to login page instead of automatically logging in and going to dashboard
    router.push('/login?registered=true');
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserData, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
