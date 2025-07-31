'use client';

import { useContext } from 'react';
import { AuthContext } from '@/providers/auth-provider';

/**
 * Client-side auth utilities - Only use in client components
 */

export function useClientAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within AuthProvider');
  }
  return context;
}

export function useRequireClientAuth() {
  const auth = useClientAuth();
  
  if (!auth.isLoading && !auth.user) {
    throw new Error('Authentication required');
  }
  
  return auth;
}

export function useRequireClientAdmin() {
  const auth = useClientAuth();
  
  if (!auth.isLoading && !auth.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return auth;
}