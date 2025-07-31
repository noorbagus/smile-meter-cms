'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Use ref to prevent useEffect dependency issues
  const profileFetchedRef = useRef(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    // Prevent duplicate fetches
    if (profileFetchedRef.current) return;
    profileFetchedRef.current = true;
    
    try {
      console.log('[AUTH] Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AUTH] Profile fetch error:', error);
        throw error;
      }
      
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: []
      };
      
      // Only fetch assigned units for store managers
      if (data.role === 'store_manager') {
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('id')
          .eq('assigned_manager_id', userId);
        
        if (!unitsError && unitsData) {
          userProfile.assigned_units = unitsData.map(unit => unit.id);
        }
      }
      
      console.log('[AUTH] Profile fetched successfully:', userProfile);
      setProfile(userProfile);
    } catch (error) {
      console.error('[AUTH] Error fetching user profile:', error);
      // Don't throw - just continue without profile
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] Initializing auth...');
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('[AUTH] Initial session:', !!initialSession);
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
        }
        
        setHasInitialized(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error('[AUTH] Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };

    initializeAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log('[AUTH] Auth state changed:', event, !!newSession);
        
        // Reset profile fetch ref on auth changes
        profileFetchedRef.current = false;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        
        if (!hasInitialized) {
          setHasInitialized(true);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      profileFetchedRef.current = false; // Reset for new sign in
      
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
    try {
      profileFetchedRef.current = false;
      await supabase.auth.signOut();
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