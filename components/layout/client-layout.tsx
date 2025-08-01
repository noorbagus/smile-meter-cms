// components/layout/client-layout.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import AppShell from './app-shell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  
  // Pages that don't need auth
  const publicPages = ['/login', '/debug', '/test-dashboard', '/debug-supabase'];
  const isPublicPage = publicPages.includes(pathname);
  
  // Show loading spinner during auth check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 rounded-full border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }
  
  // For public pages or when user is not authenticated, render children directly
  if (isPublicPage || !user) {
    return <>{children}</>;
  }
  
  // For authenticated users on protected pages, use AppShell
  return <AppShell>{children}</AppShell>;
}