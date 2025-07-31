'use client';

import { useContext, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '@/providers/auth-provider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('[useAuth] Hook used outside of AuthProvider context');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(redirectTo = '/login') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('[useRequireAuth] Running auth check', {
      isLoading: auth.isLoading,
      hasUser: !!auth.user,
      pathname,
      redirectTo
    });

    if (!auth.isLoading) {
      if (!auth.user) {
        console.log('[useRequireAuth] No authenticated user, redirecting to:', redirectTo);
        
        // Add current path as redirect parameter if not the login page itself
        const redirectPath = pathname !== '/login' 
          ? `${redirectTo}?redirectTo=${encodeURIComponent(pathname)}`
          : redirectTo;
        
        console.log('[useRequireAuth] Final redirect path:', redirectPath);
        router.push(redirectPath);
      } else {
        console.log('[useRequireAuth] User authenticated:', auth.user.email);
      }
    } else {
      console.log('[useRequireAuth] Auth state still loading, waiting...');
    }
  }, [auth.isLoading, auth.user, router, redirectTo, pathname]);

  return auth;
}

export function useRequireAdmin(redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('[useRequireAdmin] Running admin check', { 
      isLoading: auth.isLoading, 
      hasUser: !!auth.user, 
      isAdmin: auth.isAdmin,
      pathname
    });

    if (!auth.isLoading) {
      if (!auth.user) {
        console.log('[useRequireAdmin] No authenticated user, redirecting to login');
        router.push('/login');
      } else if (!auth.isAdmin) {
        console.log('[useRequireAdmin] User not admin, redirecting to:', redirectTo);
        router.push(redirectTo);
      } else {
        console.log('[useRequireAdmin] Admin access confirmed');
      }
    }
  }, [auth.isLoading, auth.user, auth.isAdmin, router, redirectTo, pathname]);

  return auth;
}

export function useUnitAccess(unitId: string | undefined, redirectTo = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('[useUnitAccess] Checking unit access', { 
      unitId, 
      isLoading: auth.isLoading, 
      hasUser: !!auth.user,
      pathname
    });

    if (!auth.isLoading && auth.user && unitId) {
      const hasAccess = auth.canAccessUnit(unitId);
      console.log('[useUnitAccess] Access check result:', hasAccess);
      
      if (!hasAccess) {
        console.log('[useUnitAccess] Access denied, redirecting to:', redirectTo);
        router.push(redirectTo);
      }
    } else if (!auth.isLoading && !auth.user) {
      console.log('[useUnitAccess] No authenticated user, redirecting to login');
      router.push('/login');
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
    console.log('[useFeatureAccess] Checking access for feature:', feature, {
      hasUser: !!auth.user,
      isAdmin: auth.isAdmin
    });
    
    if (!auth.user) {
      console.log('[useFeatureAccess] No authenticated user, denying access');
      return false;
    }
    
    let result = false;
    
    switch (feature) {
      case 'user_management':
        result = auth.isAdmin;
        console.log('[useFeatureAccess] User management requires admin:', result);
        break;
      case 'analytics':
      case 'scheduling':
      case 'unit_management':
        result = true; // All authenticated users can access these features
        console.log(`[useFeatureAccess] Feature ${feature} accessible to all authenticated users`);
        break;
      default:
        console.log('[useFeatureAccess] Unknown feature, denying access');
        result = false;
    }
    
    return result;
  }, [auth.user, auth.isAdmin, feature]);
  
  return {
    ...auth,
    canAccess: canAccess()
  };
}