'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  unitId?: string;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  unitId,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isAdmin, isLoading, canAccessUnit } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth check

    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If admin required but user is not admin
    if (requireAdmin && !isAdmin) {
      router.push(redirectTo);
      return;
    }

    // If unit access check is needed
    if (unitId && !canAccessUnit(unitId)) {
      router.push(redirectTo);
      return;
    }
  }, [user, isAdmin, isLoading, requireAdmin, unitId, canAccessUnit, router, redirectTo]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-300 rounded-full border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  // If not authenticated or doesn't have proper permissions, show nothing
  // (useEffect will handle redirect)
  if (
    !user ||
    (requireAdmin && !isAdmin) ||
    (unitId && !canAccessUnit(unitId))
  ) {
    return null;
  }

  // User is authenticated and has proper permissions
  return <>{children}</>;
}