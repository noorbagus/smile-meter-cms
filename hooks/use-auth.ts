// hooks/use-auth.ts
'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/providers/auth-provider';
import { signOut as serverSignOut } from '@/app/login/actions';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Return the context directly without overriding anything
  return context;
}

// This hook is now much simpler since most auth checks happen server-side
export function useRequireAuth() {
  const auth = useAuth();
  return auth;
}

// This hook can still be useful for client-side checks
export function useRequireAdmin() {
  const auth = useAuth();
  const router = useRouter();
  
  if (!auth.isLoading && !auth.isAdmin) {
    router.push('/dashboard');
  }
  
  return auth;
}

// This hook checks unit access client-side
export function useUnitAccess(unitId: string | undefined) {
  const auth = useAuth();
  
  return {
    ...auth,
    hasAccess: unitId ? auth.canAccessUnit(unitId) : false
  };
}