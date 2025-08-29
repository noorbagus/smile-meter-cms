// hooks/useAuthGuard.js - Improved version
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../pages/_app';

export const useAuthGuard = (requiredRole = null) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth context to finish loading
      if (authLoading) {
        console.log('⏳ Auth context loading...');
        return;
      }

      console.log('🛡️ Auth guard check:', {
        user: user?.email || 'No user',
        profile: profile?.role || 'No profile',
        requiredRole,
        currentPath: router.pathname,
        authLoading
      });

      try {
        // Case 1: No user
        if (!user) {
          if (router.pathname !== '/login') {
            console.log('🔒 No user, redirecting to login');
            await router.replace('/login');
            return;
          }
          // User is on login page and not authenticated - correct state
          setLocalLoading(false);
          return;
        }

        // Case 2: User exists but no profile
        if (!profile) {
          console.log('❌ User exists but no profile, redirecting to login');
          await router.replace('/login');
          return;
        }

        // Case 3: Authenticated user on login page
        if (router.pathname === '/login') {
          console.log('✅ Authenticated user on login, redirecting to dashboard');
          if (profile.role === 'admin') {
            await router.replace('/dashboard');
          } else if (profile.role === 'customer_service') {
            await router.replace('/cs-dashboard');
          } else {
            console.log('❌ Unknown role:', profile.role);
            await router.replace('/login');
          }
          return;
        }

        // Case 4: Role-based access control
        if (requiredRole && profile.role !== requiredRole) {
          console.log(`🚫 Access denied. Required: ${requiredRole}, User has: ${profile.role}`);
          // Redirect to appropriate dashboard
          if (profile.role === 'admin') {
            await router.replace('/dashboard');
          } else if (profile.role === 'customer_service') {
            await router.replace('/cs-dashboard');
          } else {
            await router.replace('/login');
          }
          return;
        }

        // Case 5: All checks passed
        console.log('✅ Auth guard passed');
        setLocalLoading(false);

      } catch (error) {
        console.error('❌ Auth guard error:', error);
        setLocalLoading(false);
      }
    };

    checkAuth();
  }, [user, profile, authLoading, requiredRole, router]);

  // Reset local loading when route changes (except programmatic navigation)
  useEffect(() => {
    const handleRouteChangeStart = () => {
      console.log('🔄 Route changing...');
    };

    const handleRouteChangeComplete = () => {
      console.log('✅ Route change complete');
      setLocalLoading(false);
    };

    const handleRouteChangeError = () => {
      console.log('❌ Route change error');
      setLocalLoading(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  const totalLoading = authLoading || localLoading;

  console.log('🔍 useAuthGuard return:', {
    user: user?.email || 'No user',
    profile: profile?.role || 'No profile', 
    loading: totalLoading,
    authLoading,
    localLoading
  });

  return {
    user,
    profile,
    loading: totalLoading
  };
};