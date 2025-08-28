// hooks/useAuthGuard.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../pages/_app';

export const useAuthGuard = (requiredRole = null, redirectTo = '/login') => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    // If no user, redirect to login
    if (!user || !profile) {
      if (router.pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    // If user is on login page, redirect based on role
    if (router.pathname === '/login') {
      if (profile.role === 'admin') {
        router.replace('/dashboard');
      } else if (profile.role === 'customer_service') {
        router.replace('/cs-dashboard');
      }
      return;
    }

    // Check role-based access
    if (requiredRole && profile.role !== requiredRole) {
      if (profile.role === 'admin') {
        router.replace('/dashboard');
      } else if (profile.role === 'customer_service') {
        router.replace('/cs-dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, profile, loading, router, requiredRole, redirectTo]);

  return { user, profile, loading };
};