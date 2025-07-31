'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      
      console.log('User profile fetched:', data);
      
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: []
      };
      
      // If store manager, get assigned units
      if (data.role === 'store_manager') {
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('id')
          .eq('assigned_manager_id', userId);
        
        if (!unitsError && unitsData) {
          userProfile.assigned_units = unitsData.map(unit => unit.id);
        }
      }
      
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    console.log('Initializing auth state...');
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        console.log('Initial session:', session ? 'Found' : 'Not found');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Handle redirects based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === '/login';
    const isPublicPage = pathname === '/' || isLoginPage;

    console.log('Auth redirect check:', {
      isLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      pathname,
      isLoginPage,
      isPublicPage
    });

    // If no user and not on a public page, redirect to login
    if (!user && !isPublicPage) {
      console.log('Redirecting to login - no user');
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    // If user exists but no profile yet, wait for profile to load
    if (user && !profile) {
      console.log('User exists but profile loading...');
      return;
    }

    // If user is authenticated and on login page, redirect to dashboard
    if (user && profile && isLoginPage) {
      console.log('Redirecting to dashboard - user authenticated on login page');
      router.push('/dashboard');
      return;
    }

    // If on root path and authenticated, redirect to dashboard
    if (user && profile && pathname === '/') {
      console.log('Redirecting to dashboard - user on root path');
      router.push('/dashboard');
      return;
    }
  }, [user, profile, isLoading, pathname, router]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful');
      return { error: null, success: true };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { error, success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('Signing out...');
      
      setIsLoading(true);
      await supabase.auth.signOut();
      
      // Clear state
      setSession(null);
      setUser(null);
      setProfile(null);
      
      console.log('Sign out successful');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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