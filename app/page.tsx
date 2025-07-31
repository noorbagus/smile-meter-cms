// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    if (user && profile) {
      // User is fully authenticated
      console.log('User authenticated, redirecting to dashboard');
      router.replace('/dashboard');
    } else {
      // User not authenticated
      console.log('User not authenticated, redirecting to login');
      router.replace('/login');
    }
  }, [isLoading, user, profile, router]);

  // Show loading state while checking auth and redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            SM
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Smile Meter CMS
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-6 h-6 border-2 border-gray-300 rounded-full border-t-indigo-600 animate-spin"></div>
          <p className="text-sm text-gray-600">
            {isLoading ? 'Initializing...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  );
}