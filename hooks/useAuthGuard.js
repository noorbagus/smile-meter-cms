// hooks/useAuthGuard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export const useAuthGuard = (requiredRole = null) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          // No session, redirect to login unless already there
          if (router.pathname !== '/login') {
            router.replace('/login');
          }
          setLoading(false);
          return;
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .eq('is_active', true)
          .single();

        if (profileError || !profileData) {
          console.error('Profile error:', profileError);
          await supabase.auth.signOut();
          router.replace('/login');
          setLoading(false);
          return;
        }

        // Check role requirements
        if (requiredRole && profileData.role !== requiredRole) {
          console.error('Access denied: insufficient role');
          
          // Redirect to appropriate dashboard based on actual role
          const redirectPath = profileData.role === 'admin' ? '/dashboard' : '/cs-dashboard';
          if (router.pathname !== redirectPath) {
            router.replace(redirectPath);
          }
          setLoading(false);
          return;
        }

        // All checks passed
        setUser(session.user);
        setProfile(profileData);

        // Redirect authenticated users away from login page
        if (router.pathname === '/login') {
          const dashboardPath = profileData.role === 'admin' ? '/dashboard' : '/cs-dashboard';
          router.replace(dashboardPath);
          return;
        }

      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setProfile(null);
          if (router.pathname !== '/login') {
            router.replace('/login');
          }
        } else if (event === 'SIGNED_IN') {
          // Refresh the page or re-check auth
          checkAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router.pathname, requiredRole]);

  return { user, profile, loading };
};