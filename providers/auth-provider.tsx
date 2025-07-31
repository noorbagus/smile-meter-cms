// providers/auth-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const router = useRouter();

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
      
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: []
      };
      
      if (data.role === 'store_manager') {
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('id')
          .eq('assigned_manager_id', userId);
        
        if (!unitsError && unitsData) {
          userProfile.assigned_units = unitsData.map(unit => unit.id);
        }
      }
      
      console.log('User profile fetched successfully:', userProfile);
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
            setHasInitialized(true);
          }
          return;
        }

        console.log('Initial session:', session ? 'Found' : 'Not found');

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted && profile) {
              setProfile(profile);
            }
          }
          
          setIsLoading(false);
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setProfile(profile);
          }
        } else {
          setProfile(null);
        }
        
        if (hasInitialized) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, hasInitialized]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        setIsLoading(false);
        return { error, success: false };
      }
      
      console.log('Sign in successful');
      // Don't set isLoading to false here - let the auth state change handle it
      return { error: null, success: true };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      setIsLoading(false);
      return { error, success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('Signing out...');
      await supabase.auth.signOut();
      setProfile(null);
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