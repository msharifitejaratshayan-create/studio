'use client';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export const uploadCsv = (
  firestore: Firestore,
  docId: 'threads' | 'non-threads',
  file: File,
  onProgress: (percentage: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = (event.loaded / event.total) * 100;
        onProgress(percentage);
      }
    };

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          throw new Error('File content is empty.');
        }

        const docRef = doc(firestore, 'csv_data', docId);

        onProgress(100); // Mark reading as complete

        // Now we set the doc in Firestore
        await setDoc(docRef, { content }).catch(async (serverError) => {
           const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'create',
                requestResourceData: { content: `[CSV content of ${file.name}]` },
            });
            errorEmitter.emit('permission-error', permissionError);
            // also reject the promise
            reject(new Error('You do not have permission to upload this file. Please sign in.'))
        });
        
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file);
  });
};
