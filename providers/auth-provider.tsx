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
    console.log(`[AUTH] Fetching user profile for ID: ${userId}`);
    try {
      console.log('[AUTH] Querying users table...');
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AUTH] Error fetching user profile:', error);
        throw error;
      }
      
      console.log('[AUTH] User profile data retrieved:', data);
      
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: []
      };
      
      if (data.role === 'store_manager') {
        console.log('[AUTH] Store manager role detected, fetching assigned units');
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('id')
          .eq('assigned_manager_id', userId);
        
        if (!unitsError && unitsData) {
          userProfile.assigned_units = unitsData.map(unit => unit.id);
          console.log('[AUTH] Assigned units:', userProfile.assigned_units);
        } else if (unitsError) {
          console.error('[AUTH] Error fetching assigned units:', unitsError);
        }
      }
      
      console.log('[AUTH] Setting profile state:', userProfile);
      setProfile(userProfile);
    } catch (error) {
      console.error('[AUTH] Error in fetchUserProfile:', error);
    } finally {
      console.log('[AUTH] Setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('[AUTH] Initial auth setup');
    const getInitialSession = async () => {
      console.log('[AUTH] Getting initial session');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AUTH] Error getting session:', error);
      }
      
      console.log('[AUTH] Initial session:', session ? 'exists' : 'null');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('[AUTH] User found in session, fetching profile');
        await fetchUserProfile(session.user.id);
      } else {
        console.log('[AUTH] No user in session, setting isLoading to false');
        setIsLoading(false);
      }
    };
    
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Auth state changed:', event, session ? 'session exists' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('[AUTH] User in new session, fetching profile');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[AUTH] No user in new session, clearing profile and setting isLoading to false');
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log('[AUTH] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[AUTH] Sign in attempt:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AUTH] Sign in error:', error);
        throw error;
      }
      
      console.log('[AUTH] Sign in successful, session created');
      return { error: null, success: true };
    } catch (error: any) {
      console.error('[AUTH] Sign in exception:', error);
      return { error, success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AUTH] Sign out requested');
    try {
      await supabase.auth.signOut();
      console.log('[AUTH] Sign out successful, redirecting to login');
      router.push('/login');
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
    }
  }, [router]);

  const canAccessUnit = useCallback((unitId: string) => {
    if (!profile) {
      console.log('[AUTH] No profile, cannot access unit:', unitId);
      return false;
    }
    
    if (profile.role === 'admin') {
      console.log('[AUTH] Admin role, access granted to unit:', unitId);
      return true;
    }
    
    const hasAccess = profile.assigned_units?.includes(unitId) || false;
    console.log(`[AUTH] Store manager access check for unit ${unitId}:`, hasAccess);
    return hasAccess;
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

  console.log('[AUTH] Current auth state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    isLoading, 
    isAdmin: profile?.role === 'admin' || false 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}