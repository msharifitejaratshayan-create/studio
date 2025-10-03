import { DataLensDashboard } from '@/components/dashboard/DataLensDashboard';
import { FirebaseProvider } from '@/firebase';


export default function Home() {
  return (
    <FirebaseProvider>
      <main className="min-h-screen w-full">
        <DataLensDashboard />
      </main>
    </FirebaseProvider>
  );
}
