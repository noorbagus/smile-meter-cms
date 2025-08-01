// app/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { user } = useAuth();

  // AuthProvider + ClientLayout akan handle semua redirect logic
  // Ini hanya fallback UI selama proses redirect
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
        <p className="text-sm text-gray-600">
          {user ? 'Redirecting to dashboard...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}