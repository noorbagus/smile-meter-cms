// providers/auth-provider.tsx - Add more debugging
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
  const router = useRouter();

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('[AUTH] Starting fetchUserProfile for userId:', userId);
    try {
      // Add timeout to prevent hanging
      console.log('[AUTH] Querying users table with timeout...');
      const queryPromise = supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      console.log('[AUTH] Query completed. Data:', data, 'Error:', error);
      
      if (error) {
        console.error('[AUTH] Error fetching user profile:', error);
        throw error;
      }
      
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: []
      };
      
      console.log('[AUTH] User profile created:', userProfile);

      if (data.role === 'store_manager') {
        console.log('[AUTH] Fetching assigned units for store manager...');
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('id')
          .eq('assigned_manager_id', userId);
        
        if (!unitsError && unitsData) {
          userProfile.assigned_units = unitsData.map(unit => unit.id);
          console.log('[AUTH] Assigned units:', userProfile.assigned_units);
        } else if (unitsError) {
          console.warn('[AUTH] Error fetching units (non-critical):', unitsError);
        }
      }
      
      console.log('[AUTH] Setting profile state...');
      setProfile(userProfile);
      console.log('[AUTH] Profile set successfully');
    } catch (error: any) {
      console.error('[AUTH] Error in fetchUserProfile:', error);
      if (error.name === 'AbortError') {
        console.error('[AUTH] Query timed out after 10 seconds');
      }
      // Set profile to null on error to prevent infinite loading
      setProfile(null);
    } finally {
      console.log('[AUTH] Setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[AUTH] Initial auth setup');
    const getInitialSession = async () => {
      console.log('[AUTH] Getting initial session');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[AUTH] Initial session result:', { session: !!session, error });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('[AUTH] User found in initial session, fetching profile');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[AUTH] No user in initial session');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AUTH] Error getting initial session:', error);
        setIsLoading(false);
      }
    };
    
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Auth state changed:', event, 'session exists:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('[AUTH] User in new session, fetching profile');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[AUTH] No user in new session');
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      return { error: null, success: true };
    } catch (error: any) {
      return { error, success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  const canAccessUnit = useCallback((unitId: string) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.assigned_units?.includes(unitId) || false;
  }, [profile]);

  // Add current state logging
  useEffect(() => {
    console.log('[AUTH] Current auth state:', {
      hasUser: !!user,
      hasProfile: !!profile,
      isLoading,
      isAdmin: profile?.role === 'admin'
    });
  }, [user, profile, isLoading]);

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