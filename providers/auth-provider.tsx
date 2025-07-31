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
        
        // If profile doesn't exist, create a mock profile for testing
        if (error.code === 'PGRST116') {
          console.log('User profile not found, using mock profile for testing...');
          
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const mockProfile: UserProfile = {
              id: userData.user.id,
              email: userData.user.email || 'test@example.com',
              role: 'admin',
              assigned_units: []
            };
            
            console.log('Created mock profile:', mockProfile);
            setProfile(mockProfile);
            return mockProfile;
          }
        }
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
        try {
          const { data: unitsData, error: unitsError } = await supabase
            .from('units')
            .select('id')
            .eq('assigned_manager_id', userId);
          
          if (!unitsError && unitsData) {
            userProfile.assigned_units = unitsData.map(unit => unit.id);
          }
        } catch (unitError) {
          console.warn('Could not fetch assigned units:', unitError);
        }
      }
      
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
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

  // Handle redirects - VERY MINIMAL
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === '/login';
    const isTestPage = pathname.startsWith('/test') || pathname.startsWith('/debug');
    const isRootPage = pathname === '/';

    console.log('Auth redirect check:', {
      isLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      pathname,
      isLoginPage,
      isTestPage,
      isRootPage
    });

    // Skip redirect for test pages
    if (isTestPage) {
      console.log('On test/debug page, skipping auth redirect');
      return;
    }

    // Only redirect if we have clear auth state
    if (!user && !isLoginPage && !isRootPage) {
      console.log('No user, redirecting to login');
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && profile && (isLoginPage || isRootPage)) {
      console.log('User authenticated, redirecting to dashboard');
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
      
      await supabase.auth.signOut();
      
      // Clear state
      setSession(null);
      setUser(null);
      setProfile(null);
      
      console.log('Sign out successful');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
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