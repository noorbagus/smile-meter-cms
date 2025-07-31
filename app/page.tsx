// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        console.log('Root: User authenticated, redirecting to dashboard');
        router.replace('/dashboard');
      } else {
        console.log('Root: No user, redirecting to login');
        router.replace('/login');
      }
    }
  }, [isLoading, user, router]);

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            SM
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
          Smile Meter CMS
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isLoading ? 'Loading...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}