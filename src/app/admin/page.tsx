'use client';

import React, { useState, DragEvent } from 'react';
import { useAuth, useFirebase, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, FileCode, Loader2, UploadCloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { uploadCsv } from '@/lib/firestore-data';

const FileUploader = ({
  title,
  docId,
  onUpload,
  disabled
}: {
  title: string;
  docId: 'threads' | 'non-threads';
  onUpload: (docId: 'threads' | 'non-threads', file: File) => void;
  disabled: boolean
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(docId, e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(docId, e.target.files[0]);
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
          <FileCode className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>Upload a CSV file to update the live data.</CardDescription>
      </CardHeader>
      <CardContent>
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted'
          } ${disabled ? 'cursor-not-allowed bg-muted/50' : ''}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`mb-2 text-sm ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">CSV files up to 50MB</p>
          </div>
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" disabled={disabled}/>
        </label>
      </CardContent>
    </Card>
  );
};


export default function AdminPage() {
  const { auth, user, signIn, signOut } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [loading, setLoading] = useState<'threads' | 'non-threads' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<'threads' | 'non-threads' | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (docId: 'threads' | 'non-threads', file: File) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firestore is not initialized.',
      });
      return;
    }
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be signed in to upload files.',
        });
        return;
    }

    setLoading(docId);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
        await uploadCsv(firestore, docId, file, (p) => setProgress(p));
        setSuccess(docId);
        toast({
            title: 'Upload Successful',
            description: `The ${docId}.csv file has been updated.`,
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : `Failed to upload ${docId}.csv.`;
        setError(errorMsg);
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: errorMsg,
        });
    } finally {
        setLoading(null);
        setProgress(0);
    }
  };

  const handleSignIn = async () => {
    if (!auth) return;
    try {
      await signIn('anonymous');
      toast({ title: 'Signed in anonymously.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: 'Could not sign in anonymously.',
      });
    }
  };

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        {auth && (
            <div>
            {user ? (
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Signed in as {user.isAnonymous ? 'Anonymous' : user.uid}</span>
                    <Button variant="outline" onClick={signOut}>Sign Out</Button>
                </div>
            ) : (
                <Button onClick={handleSignIn}>Sign In Anonymously</Button>
            )}
            </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full">
        <div className="flex-1">
            <FileUploader title="Threads CSV" docId="threads" onUpload={handleFileUpload} disabled={!user || !!loading}/>
        </div>
        <div className="flex-1">
            <FileUploader title="Non-Threads CSV" docId="non-threads" onUpload={handleFileUpload} disabled={!user || !!loading}/>
        </div>
      </div>
      
      {loading && (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Upload in Progress</CardTitle>
                <CardDescription>Please wait while the file is being uploaded and processed.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Uploading {loading}.csv...</span>
                </div>
                <Progress value={progress} className="w-full mt-2" />
            </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="mt-8 bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Upload Successful!</AlertTitle>
            <AlertDescription>The {success}.csv file has been successfully uploaded to the database.</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
