'use client'; // This is a client component

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      router.push('/tasks'); // Redirect to tasks if logged in
    } else {
      router.push('/login'); // Redirect to login if not logged in
    }
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading...</p> {/* Or a spinner */}
    </div>
  );
}