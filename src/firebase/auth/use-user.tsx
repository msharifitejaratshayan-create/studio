'use client';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useAuth } from '@/firebase';

export function useUser(): User | null {
  const { auth } = useAuth();
  const [user, setUser] = useState<User | null>(auth?.currentUser || null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  return user;
}
