"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'kX3ZyTAUNl4Cvkj8mftnYVozg7VOn8tMH9nV0pqJ';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('isAuthenticated') === 'true';
    }
    return false;
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.push('/');
    }
  }, [isAuthenticated, pathname, router]);

  const login = (user: string, pass: string) => {
    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    router.push('/login');
  };

  if (!isAuthenticated && pathname !== '/login') {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
