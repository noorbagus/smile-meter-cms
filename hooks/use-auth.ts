// File: hooks/use-auth.ts

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
export function useRequireAuth() {
  const auth = useAuth();
  return auth;
}

export function useRequireAdmin() {
  const auth = useAuth();
  return auth;
}

export function useUnitAccess(unitId: string | undefined) {
  const auth = useAuth();

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