// hooks/use-auth.ts
'use client';

import { useContext, useCallback } from 'react';
import { AuthContext } from '@/providers/auth-provider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Simplified hooks - no redirect logic, state-only
// AuthProvider + ClientLayout handle all redirects
export function useRequireAuth() {
  const auth = useAuth();
  
  // Return auth state - let components decide what to do
  // AuthProvider already handles redirect to login
  return {
    ...auth,
    isAuthenticated: !!auth.user
  };
}

export function useRequireAdmin() {
  const auth = useAuth();
  
  // Return auth state - let components decide what to do  
  // AuthProvider already handles basic auth redirect
  return {
    ...auth,
    isAuthenticated: !!auth.user,
    hasAdminAccess: auth.isAdmin
  };
}

export function useUnitAccess(unitId: string | undefined) {
  const auth = useAuth();

  return {
    ...auth,
    hasAccess: unitId ? auth.canAccessUnit(unitId) : false,
    isAuthenticated: !!auth.user
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
    canAccess: canAccess(),
    isAuthenticated: !!auth.user
  };
}