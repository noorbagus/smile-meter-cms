// hooks/useAuthGuard.js - Fixed with navigation throttling prevention
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../pages/_app';

export const useAuthGuard = (requiredRole = null) => {
  const { user, profile, loading: authLoading, isRedirecting } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (redirected.current || isRedirecting) return;

    const checkAuth = async () => {
      if (authLoading) return;

      // No user - redirect to login  
      if (!user) {
        if (router.pathname !== '/login') {
          redirected.current = true;
          await router.replace('/login');
        }
        setLoading(false);
        return;
      }

      // No profile - redirect to login
      if (!profile) {
        if (router.pathname !== '/login') {
          redirected.current = true;
          await router.replace('/login');
        }
        setLoading(false);
        return;
      }

      // Check role requirement
      if (requiredRole && profile.role !== requiredRole) {
        let targetPath;
        
        if (profile.role === 'admin' && router.pathname !== '/dashboard') {
          targetPath = '/dashboard';
        } else if (profile.role === 'customer_service' && router.pathname !== '/cs-dashboard') {
          targetPath = '/cs-dashboard';
        } else if (router.pathname !== '/login') {
          targetPath = '/login';
        }

        if (targetPath) {
          redirected.current = true;
          await router.replace(targetPath);
          setLoading(false);
          return;
        }
      }

      // Auth passed - allow access
      setLoading(false);
    };

    checkAuth();
  }, [user, profile, authLoading, requiredRole, router.pathname, isRedirecting]);

  return {
    user,
    profile,
    loading: authLoading || loading
  };
};