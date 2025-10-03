'use client';

import React, { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { type FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
      console.error("Caught permission error:", e);
      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (!error) {
    return null;
  }

  // This is a developer-only overlay to help debug security rules.
  // It will not be visible in production.
  if (process.env.NODE_ENV === 'development') {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-2xl w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Firestore Security Rules Error</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">A request was denied by your security rules.</p>
                    <div className="bg-gray-800 p-3 rounded-md text-xs font-mono mb-4 overflow-auto">
                        <p><span className="font-semibold text-yellow-400">Operation:</span> {error.context.operation}</p>
                        <p><span className="font-semibold text-yellow-400">Path:</span> {error.context.path}</p>
                        {error.context.requestResourceData && (
                        <div>
                            <p className="font-semibold text-yellow-400 mt-2">Request Data:</p>
                            <pre className="mt-1">{JSON.stringify(error.context.requestResourceData, null, 2)}</pre>
                        </div>
                        )}
                    </div>
                     <p className="text-xs text-gray-400 mb-4">
                        Check your `firestore.rules` file to ensure the currently signed-in user has permission to perform this action.
                     </p>
                    <Button onClick={() => setError(null)} variant="outline" className="w-full">
                        Dismiss
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return null;
}
