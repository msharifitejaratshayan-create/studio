"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('accessToken');
    }
    return false;
  });
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = !['/login', '/admin'].some(path => pathname.startsWith(path));

  const checkAuth = useCallback(() => {
    const token = sessionStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, [checkAuth]);

  useEffect(() => {
    if (isProtectedRoute && !isAuthenticated) {
      router.push('/login');
    } else if (pathname === '/login' && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isProtectedRoute, pathname, router]);

  const login = async (user: string, pass: string) => {
    try {
      const { access_token } = await loginUser(user, pass);
      if (access_token) {
        sessionStorage.setItem('accessToken', access_token);
        setIsAuthenticated(true);
        router.push('/');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    router.push('/login');
  };

  if (isProtectedRoute && !isAuthenticated) {
    return null; // or a loading spinner
  }

  // Do not wrap admin page with this provider
  if (pathname.startsWith('/admin')) {
      return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
