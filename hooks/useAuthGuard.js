// hooks/useAuthGuard.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../pages/_app';

export const useAuthGuard = (requiredRole = null) => {
  const { user, profile, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect during loading or if there's an error
    if (loading || error) return;

    // If no user and not on login page, redirect to login
    if (!user && router.pathname !== '/login') {
      console.log('🔒 No user, redirecting to login');
      router.replace('/login');
      return;
    }

    // If user exists but no profile, stay on current page (loading profile)
    if (user && !profile) {
      console.log('👤 User exists but profile loading...');
      return;
    }

    // If user and profile exist, check role and redirect if needed
    if (user && profile) {
      // If on login page with valid session, redirect to appropriate dashboard
      if (router.pathname === '/login') {
        const targetPath = profile.role === 'admin' ? '/dashboard' : '/cs-dashboard';
        console.log('✅ Already logged in, redirecting to', targetPath);
        router.replace(targetPath);
        return;
      }

      // Check role requirement
      if (requiredRole && profile.role !== requiredRole) {
        console.log('🚫 Role mismatch, redirecting...');
        const correctPath = profile.role === 'admin' ? '/dashboard' : '/cs-dashboard';
        router.replace(correctPath);
        return;
      }
    }
  }, [user, profile, loading, error, router.pathname, requiredRole]);

  // Return auth state - don't return null/redirect components here
  // Let the components handle their own loading states
  return {
    user,
    profile,
    loading: loading && !error, // Don't show loading if there's an error
    error,
    isAuthenticated: !!user && !!profile,
    isAuthorized: !requiredRole || (profile?.role === requiredRole)
  };
};