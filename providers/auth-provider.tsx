// providers/auth-provider.tsx
'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'store_manager';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  assigned_units?: string[];
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStoreManager: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; success: boolean; }>;
  signOut: () => Promise<void>;
  canAccessUnit: (unitId: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  console.log('[AUTH] State:', { isLoading, isInitialized, hasUser: !!user, hasProfile: !!profile });

  const createProfileFromUser = useCallback((user: User): UserProfile => {
    return {
      id: user.id,
      email: user.email || 'user@example.com',
      role: 'admin', // Default for demo
      assigned_units: []
    };
  }, []);

  // Centralized state update function
  const updateAuthState = useCallback((newSession: Session | null) => {
    console.log('[AUTH] Updating state with session:', !!newSession);
    
    setSession(newSession);
    setUser(newSession?.user ?? null);
    
    if (newSession?.user) {
      const newProfile = createProfileFromUser(newSession.user);
      setProfile(newProfile);
    } else {
      setProfile(null);
    }
  }, [createProfileFromUser]);

  // Handle navigation based on auth state
  const handleNavigation = useCallback((hasUser: boolean, currentPath: string) => {
    console.log('[AUTH] Handling navigation:', { hasUser, currentPath });
    
    // Don't redirect during initialization
    if (!isInitialized) return;
    
    const isLoginPage = currentPath === '/login';
    const isPublicPage = ['/login', '/debug', '/test-dashboard'].includes(currentPath);
    
    if (hasUser && isLoginPage) {
      console.log('[AUTH] User logged in, redirecting to dashboard');
      router.replace('/dashboard');
    } else if (!hasUser && !isPublicPage) {
      console.log('[AUTH] No user, redirecting to login');
      router.replace('/login');
    }
  }, [isInitialized, router]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('[AUTH] Initializing...');
      
      try {
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Session error:', error);
        }
        
        if (mounted) {
          updateAuthState(session);
          setIsLoading(false);
          setIsInitialized(true);
          
          // Handle initial navigation
          const currentPath = window.location.pathname;
          handleNavigation(!!session?.user, currentPath);
        }
      } catch (error) {
        console.error('[AUTH] Init error:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  // Set up auth state listener AFTER initialization
  useEffect(() => {
    if (!isInitialized) return;

    console.log('[AUTH] Setting up auth listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Auth state changed:', event, !!session);
        
        updateAuthState(session);
        
        // Handle navigation for auth state changes
        const currentPath = window.location.pathname;
        handleNavigation(!!session?.user, currentPath);
      }
    );

    return () => {
      console.log('[AUTH] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [isInitialized, updateAuthState, handleNavigation]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[AUTH] Sign in attempt');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AUTH] Sign in error:', error);
        return { error, success: false };
      }
      
      console.log('[AUTH] Sign in success');
      // State will be updated by the auth listener
      return { error: null, success: true };
    } catch (error: any) {
      console.error('[AUTH] Sign in exception:', error);
      return { error, success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AUTH] Sign out');
    try {
      await supabase.auth.signOut();
      // State will be updated by the auth listener
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