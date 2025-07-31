// app/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { isLoading } = useAuth();

  // Show loading while AuthProvider handles auth state and redirects
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
            {isLoading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  );
}