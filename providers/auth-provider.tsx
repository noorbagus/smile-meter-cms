// providers/auth-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'store_manager';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  assigned_units?: string[];
  name?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStoreManager: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
  canAccessUnit: (unitId: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/debug', '/test-dashboard', '/debug-supabase'];

// Routes that require admin access
const ADMIN_ROUTES = ['/users'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasHandledInitialRedirect = useRef(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AUTH] Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AUTH] Error fetching user profile:', error);
        return null;
      }
      
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: []
      };
      
      // Get assigned units for store managers
      if (data.role === 'store_manager') {
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('id')
          .eq('assigned_manager_id', userId);
        
        if (!unitsError && unitsData) {
          userProfile.assigned_units = unitsData.map(unit => unit.id);
        }
      }
      
      console.log('[AUTH] User profile fetched:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('[AUTH] Exception fetching user profile:', error);
      return null;
    }
  }, []);

  // Centralized redirect logic
  const handleRedirect = useCallback((user: User | null, profile: UserProfile | null, currentPath: string) => {
    console.log('[AUTH] handleRedirect called:', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      currentPath,
      isPublicRoute: PUBLIC_ROUTES.includes(currentPath)
    });

    // Clear any existing redirect timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // If on public route and authenticated, redirect to dashboard
    if (user && profile && PUBLIC_ROUTES.includes(currentPath)) {
      console.log('[AUTH] Authenticated user on public route, redirecting to dashboard');
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return;
    }

    // If not authenticated and not on public route, redirect to login
    if (!user && !PUBLIC_ROUTES.includes(currentPath)) {
      console.log('[AUTH] Unauthenticated user on protected route, redirecting to login');
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return;
    }

    // If authenticated but on admin route without admin role
    if (user && profile && ADMIN_ROUTES.some(route => currentPath.startsWith(route)) && profile.role !== 'admin') {
      console.log('[AUTH] Non-admin user on admin route, redirecting to dashboard');
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return;
    }

    console.log('[AUTH] No redirect needed');
  }, [router]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Initializing auth state...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        console.log('[AUTH] Initial session:', session ? 'Found' : 'Not found');

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setProfile(profile);
              setIsLoading(false);
              setAuthInitialized(true);
              
              // Handle initial redirect after auth is fully loaded
              if (!hasHandledInitialRedirect.current) {
                hasHandledInitialRedirect.current = true;
                handleRedirect(session.user, profile, pathname);
              }
            }
          } else {
            setProfile(null);
            setIsLoading(false);
            setAuthInitialized(true);
            
            // Handle redirect for unauthenticated user
            if (!hasHandledInitialRedirect.current) {
              hasHandledInitialRedirect.current = true;
              handleRedirect(null, null, pathname);
            }
          }
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [fetchUserProfile, handleRedirect, pathname]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setProfile(profile);
          
          // Handle redirect after auth state change
          handleRedirect(session.user, profile, pathname);
        } else {
          setProfile(null);
          
          // Handle redirect for sign out
          handleRedirect(null, null, pathname);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, handleRedirect, pathname]);

  // Handle route changes for authenticated users
  useEffect(() => {
    if (authInitialized && !isLoading) {
      handleRedirect(user, profile, pathname);
    }
  }, [pathname, authInitialized, isLoading, user, profile, handleRedirect]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('[AUTH] Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AUTH] Sign in error:', error);
        return { error, success: false };
      }
      
      console.log('[AUTH] Sign in successful');
      // Auth state change will handle profile fetching and redirect
      return { error: null, success: true };
    } catch (error: any) {
      console.error('[AUTH] Sign in exception:', error);
      return { error, success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[AUTH] Signing out...');
      await supabase.auth.signOut();
      setProfile(null);
      // Auth state change will handle redirect
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
    }
  }, []);

  const canAccessUnit = useCallback((unitId: string) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.assigned_units?.includes(unitId) || false;
  }, [profile]);

  const value = {
    session,
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin' || false,
    isStoreManager: profile?.role === 'store_manager' || false,
    signIn,
    signOut,
    canAccessUnit,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}