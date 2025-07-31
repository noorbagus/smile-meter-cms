'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[DashboardLayout] Rendering dashboard layout');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, profile } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[DashboardLayout] useEffect running', {
      isLoading,
      hasUser: !!user,
      hasProfile: !!profile
    });
    
    // This is additional protection beyond useRequireAuth
    if (!isLoading && !user) {
      console.log('[DashboardLayout] No authenticated user detected in layout, redirecting to login');
      router.push('/login');
    }
  }, [isLoading, user, router, profile]);

  console.log('[DashboardLayout] Current auth state before render decision', {
    isLoading,
    hasUser: !!user,
    hasProfile: !!profile
  });

  if (isLoading) {
    console.log('[DashboardLayout] Still loading, showing loading state');
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-blue-200"></div>
          <div className="mt-4 h-4 w-24 mx-auto rounded bg-blue-200"></div>
          <div className="mt-2 text-sm text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Double check authentication - this shouldn't happen due to useRequireAuth
  // but adding as defensive programming
  if (!user || !profile) {
    console.log('[DashboardLayout] No user/profile after loading complete, emergency redirect');
    router.push('/login');
    return null;
  }

  console.log('[DashboardLayout] Authentication confirmed, rendering dashboard');
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}