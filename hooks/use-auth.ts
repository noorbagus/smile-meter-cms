'use client';

import { useContext, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '@/providers/auth-provider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useRequireAuth(redirectTo = '/login') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.user && !hasRedirected.current) {
      if (pathname !== redirectTo) {
        hasRedirected.current = true;
        router.push(redirectTo);
      }
    }
    
    if (auth.user) {
      hasRedirected.current = false;
    }
  }, [auth.isLoading, auth.user, router, redirectTo, pathname]);

  return auth;
}

export function useRequireAdmin(redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.user && !hasRedirected.current) {
        if (pathname !== '/login') {
          hasRedirected.current = true;
          router.push('/login');
        }
      } else if (auth.user && !auth.isAdmin && !hasRedirected.current) {
        if (pathname !== redirectTo) {
          hasRedirected.current = true;
          router.push(redirectTo);
        }
      }
    }
    
    if (auth.user && auth.isAdmin) {
      hasRedirected.current = false;
    }
  }, [auth.isLoading, auth.user, auth.isAdmin, router, redirectTo, pathname]);

  return auth;
}

export function useUnitAccess(unitId: string | undefined, redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!auth.isLoading && auth.user && unitId) {
      if (!auth.canAccessUnit(unitId) && !hasRedirected.current) {
        if (pathname !== redirectTo) {
          hasRedirected.current = true;
          router.push(redirectTo);
        }
      }
    }
    
    if (unitId && auth.canAccessUnit(unitId)) {
      hasRedirected.current = false;
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