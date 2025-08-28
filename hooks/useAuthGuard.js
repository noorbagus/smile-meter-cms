// hooks/useAuthGuard.js
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../pages/_app';

export const useAuthGuard = (requiredRole = null) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading) return; // Still checking auth state
    
    // Reset redirect flag when user state changes
    if (!user && hasRedirected.current) {
      hasRedirected.current = false;
    }
    
    if (hasRedirected.current) return; // Already redirected

    console.log('🛡️ Auth guard check:', { user: !!user, profile: profile?.role, requiredRole, currentPath: router.pathname });

    // If no user and not on login page, redirect to login
    if (!user && router.pathname !== '/login') {
      console.log('🔒 No user, redirecting to login');
      hasRedirected.current = true;
      router.push('/login');
      return;
    }

    // If user exists but on login page, redirect based on role
    if (user && profile && router.pathname === '/login') {
      console.log('✅ User logged in on login page, redirecting based on role');
      hasRedirected.current = true;
      if (profile.role === 'admin') {
        router.push('/dashboard');
      } else if (profile.role === 'customer_service') {
        router.push('/cs-dashboard');
      }
      return;
    }

    // If user exists but no profile, there's an issue
    if (user && !profile && router.pathname !== '/login') {
      console.log('❌ User exists but no profile, redirecting to login');
      hasRedirected.current = true;
      router.push('/login');
      return;
    }

    // Check role requirements for protected pages
    if (user && profile && requiredRole && profile.role !== requiredRole) {
      console.log('🚫 Wrong role, redirecting');
      hasRedirected.current = true;
      // Redirect to appropriate dashboard based on actual role
      if (profile.role === 'admin') {
        router.push('/dashboard');
      } else if (profile.role === 'customer_service') {
        router.push('/cs-dashboard');
      } else {
        router.push('/login');
      }
      return;
    }

  }, [user, profile, loading, requiredRole, router]);

  // Reset redirect flag when route changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [router.pathname]);

  return { user, profile, loading };
};