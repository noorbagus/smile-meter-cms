// hooks/use-auth.ts
'use client';

import { useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth as useAuthProvider } from '@/providers/auth-provider';

// Re-export the basic auth hook
export const useAuth = useAuthProvider;

// Protected routes hook
export function useRequireAuth(redirectTo = '/login') {
  const auth = useAuthProvider();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.user, router, redirectTo]);

  return auth;
}

// Admin-only routes hook
export function useRequireAdmin(redirectTo = '/dashboard') {
  const auth = useAuthProvider();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.user) {
        router.push('/login');
      } else if (!auth.isAdmin) {
        router.push(redirectTo);
      }
    }
  }, [auth.isLoading, auth.user, auth.isAdmin, router, redirectTo]);

  return auth;
}

// Unit access control hook
export function useUnitAccess(unitId: string | undefined, redirectTo = '/dashboard') {
  const auth = useAuthProvider();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.isLoading && auth.user && unitId) {
      if (!auth.canAccessUnit(unitId)) {
        router.push(redirectTo);
      }
    }
  }, [auth.isLoading, auth.user, unitId, auth.canAccessUnit, router, redirectTo, pathname]);

  return {
    ...auth,
    hasAccess: unitId ? auth.canAccessUnit(unitId) : false
  };
}

// Check if user can access a specific feature
export function useFeatureAccess(feature: 'user_management' | 'analytics' | 'scheduling' | 'unit_management') {
  const auth = useAuthProvider();
  
  // Currently simple implementation based on role
  // Could be expanded with more granular permissions
  const canAccess = () => {
    if (!auth.user) return false;
    
    switch (feature) {
      case 'user_management':
        return auth.isAdmin;
      case 'analytics':
        return true; // All authenticated users
      case 'scheduling':
        return true; // All authenticated users
      case 'unit_management':
        return true; // All authenticated users can view units they have access to
      default:
        return false;
    }
  };
  
  return {
    ...auth,
    canAccess: canAccess()
  };
}