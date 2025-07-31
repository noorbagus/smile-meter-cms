'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirectedRef.current) return;

    if (user) {
      hasRedirectedRef.current = true;
      router.replace('/dashboard');
    } else {
      hasRedirectedRef.current = true;
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Show loading state while checking auth or redirecting
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
          Loading...
        </p>
      </div>
    </div>
  );
}