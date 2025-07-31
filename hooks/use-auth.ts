'use client';

import { useContext, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '@/providers/auth-provider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(redirectTo = '/login') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect if auth check is complete and no user
    if (!auth.isLoading && !auth.user && !hasRedirectedRef.current) {
      // Avoid redirecting to login if already on login page
      if (pathname !== redirectTo) {
        hasRedirectedRef.current = true;
        console.log('[AUTH] Redirecting to login from:', pathname);
        router.push(redirectTo);
      }
    }
    
    // Reset redirect flag when user becomes available
    if (auth.user) {
      hasRedirectedRef.current = false;
    }
  }, [auth.isLoading, auth.user, router, redirectTo, pathname]);

  return auth;
}

export function useRequireAdmin(redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.user && !hasRedirectedRef.current) {
        if (pathname !== '/login') {
          hasRedirectedRef.current = true;
          router.push('/login');
        }
      } else if (auth.user && !auth.isAdmin && !hasRedirectedRef.current) {
        if (pathname !== redirectTo) {
          hasRedirectedRef.current = true;
          router.push(redirectTo);
        }
      }
    }
    
    // Reset redirect flag when appropriate
    if (auth.user && auth.isAdmin) {
      hasRedirectedRef.current = false;
    }
  }, [auth.isLoading, auth.user, auth.isAdmin, router, redirectTo, pathname]);

  return auth;
}

export function useUnitAccess(unitId: string | undefined, redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!auth.isLoading && auth.user && unitId) {
      if (!auth.canAccessUnit(unitId) && !hasRedirectedRef.current) {
        if (pathname !== redirectTo) {
          hasRedirectedRef.current = true;
          router.push(redirectTo);
        }
      }
    }
    
    // Reset redirect flag when access is granted
    if (unitId && auth.canAccessUnit(unitId)) {
      hasRedirectedRef.current = false;
    }
  }, [auth.isLoading, auth.user, unitId, auth.canAccessUnit, router, redirectTo, pathname]);

  return {
    ...auth,
    hasAccess: unitId ? auth.canAccessUnit(unitId) : false
  };
}

export function useFeatureAccess(feature: 'user_management' | 'analytics' | 'scheduling' | 'unit_management') {
  const auth = useAuth();
  
  const canAccess = useCallback(() => {
    if (!auth.user) return false;
    
    switch (feature) {
      case 'user_management':
        return auth.isAdmin;
      case 'analytics':
      case 'scheduling':
      case 'unit_management':
        return true;
      default:
        return false;
    }
  }, [auth.user, auth.isAdmin, feature]);
  
  return {
    ...auth,
    canAccess: canAccess()
  };
}