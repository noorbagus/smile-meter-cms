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
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Only redirect once auth is fully loaded and no user exists
    if (!auth.isLoading && !auth.user && pathname !== redirectTo && !redirectAttempted.current) {
      redirectAttempted.current = true;
      router.push(redirectTo);
    }
    
    // Reset redirect flag when user becomes available
    if (auth.user) {
      redirectAttempted.current = false;
    }
  }, [auth.isLoading, auth.user, router, redirectTo, pathname]);

  return auth;
}

export function useRequireAdmin(redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectAttempted = useRef(false);

  useEffect(() => {
    if (auth.isLoading) return;

    // No user - redirect to login
    if (!auth.user && pathname !== '/login' && !redirectAttempted.current) {
      redirectAttempted.current = true;
      router.push('/login');
      return;
    }
    
    // User exists but not admin - redirect to dashboard
    if (auth.user && !auth.isAdmin && pathname !== redirectTo && !redirectAttempted.current) {
      redirectAttempted.current = true;
      router.push(redirectTo);
      return;
    }
    
    // Reset flag when conditions are met
    if ((auth.user && auth.isAdmin) || !auth.user) {
      redirectAttempted.current = false;
    }
  }, [auth.isLoading, auth.user, auth.isAdmin, router, redirectTo, pathname]);

  return auth;
}

export function useUnitAccess(unitId: string | undefined, redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectAttempted = useRef(false);

  const hasAccess = unitId ? auth.canAccessUnit(unitId) : false;

  useEffect(() => {
    if (auth.isLoading || !auth.user || !unitId) return;

    if (!hasAccess && pathname !== redirectTo && !redirectAttempted.current) {
      redirectAttempted.current = true;
      router.push(redirectTo);
    }
    
    // Reset flag when access is granted
    if (hasAccess) {
      redirectAttempted.current = false;
    }
  }, [auth.isLoading, auth.user, unitId, hasAccess, router, redirectTo, pathname]);

  return {
    ...auth,
    hasAccess
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