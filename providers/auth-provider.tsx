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

// providers/auth-provider.tsx
const fetchUserProfile = useCallback(async (userId: string) => {
  console.log("Fetching user profile for ID:", userId);
  try {
    console.log("Querying users table...");
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching from users table:", error);
      throw error;
    }
    
    console.log("User profile data retrieved:", data);
    
    const userProfile: UserProfile = {
      id: data.id,
      email: data.email,
      role: data.role as UserRole,
      assigned_units: []
    };
    
    if (data.role === 'store_manager') {
      console.log("Fetching assigned units for store manager");
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('id')
        .eq('assigned_manager_id', userId);
      
      if (unitsError) {
        console.error("Error fetching assigned units:", unitsError);
      } else {
        console.log("Assigned units:", unitsData);
        userProfile.assigned_units = unitsData.map(unit => unit.id);
      }
    }
    
    console.log("Setting profile state:", userProfile);
    setProfile(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
  } finally {
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

// hooks/use-auth.ts
const signIn = useCallback(async (email: string, password: string) => {
  console.log("Starting sign in process for email:", email);
  try {
    console.log("Calling supabase.auth.signInWithPassword");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Authentication error:", error);
      throw error;
    }
    
    console.log("Authentication successful, user:", data.user?.id);
    return { error: null, success: true };
  } catch (error: any) {
    console.error("Sign in failed:", error);
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