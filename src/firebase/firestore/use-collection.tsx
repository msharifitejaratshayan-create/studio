'use client';
import { useState, useEffect } from 'react';
import type {
  Query,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { onSnapshot, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface UseCollectionOptions {
  realtime?: boolean;
}

interface UseCollectionReturn<T> {
  data: T[] | null;
  loading: boolean;
  error: FirestoreError | null;
}

export function useCollection<T extends DocumentData>(
  query: Query<T> | null,
  options: UseCollectionOptions = { realtime: true }
): UseCollectionReturn<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!query || !firestore) {
      if (!firestore) setLoading(false);
      return;
    }

    setLoading(true);

    if (options.realtime) {
      const unsubscribe = onSnapshot(
        query,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setData(docs);
          setLoading(false);
        },
        async (err) => {
          const permissionError = new FirestorePermissionError({
            path: (query as any)._path.segments.join('/'),
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      getDocs(query)
        .then((snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setData(docs);
          setLoading(false);
        })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: (query as any)._path.segments.join('/'),
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setError(err);
          setLoading(false);
        });
    }
  }, [query, firestore, options.realtime]);

  return { data, loading, error };
}
