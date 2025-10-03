// src/firebase/provider.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { initializeFirebase } from './';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    firestore: null,
  });

  useEffect(() => {
    const init = async () => {
      const { app, auth, firestore } = await initializeFirebase();
      setFirebase({ app, auth, firestore });
    };
    init();
  }, []);

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase()?.app;
}
export function useAuth() {
  const auth = useFirebase()?.auth;
  const [user, setUser] = useState(auth?.currentUser);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, [auth]);

  const signIn = async (provider: 'anonymous') => {
    if (!auth) throw new Error('Auth is not initialized');
    const { signInAnonymously } = await import('firebase/auth');
    return signInAnonymously(auth);
  };
  
  const signOut = async () => {
    if (!auth) throw new Error('Auth is not initialized');
    return auth.signOut();
  }

  return { auth, user, signIn, signOut };
}

export function useFirestore() {
  return useFirebase()?.firestore;
}
