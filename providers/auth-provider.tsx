// providers/auth-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initial session fetch
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

    // Set up auth state change listener
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
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Create a properly typed profile (without name since it doesn't exist)
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: []
      };
      
      // For store managers, fetch their assigned units
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
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
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
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const canAccessUnit = (unitId: string) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.assigned_units?.includes(unitId) || false;
  };

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hooks for protected routes
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  return { user, isLoading };
}

export function useRequireAdmin() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  return { isAdmin, isLoading };
}