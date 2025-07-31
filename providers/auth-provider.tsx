// providers/auth-provider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

type UserRole = 'admin' | 'store_manager';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  assigned_units?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStoreManager: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  canAccessUnit: (unitId: string) => boolean;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isStoreManager: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  canAccessUnit: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        assigned_units: [],
      };
      
      if (data.role === 'store_manager') {
        const { data: unitsData } = await supabase
          .from('units')
          .select('id')
          .eq('assigned_manager_id', userId);
        
        userProfile.assigned_units = unitsData?.map(unit => unit.id) || [];
      }
      
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setIsLoading(false);
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user || null);
          
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
    };
    
    initAuth();
  }, []);

  // Sign out function - using new approach
  const signOut = async () => {
    try {
      // The actual signOut is handled by the server action
      // This is just for client-side state cleanup
      setUser(null);
      setProfile(null);
      
      // Redirect is handled by the server action
      window.location.href = '/api/auth/signout';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  // Check if user has access to a unit
  const canAccessUnit = (unitId: string) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.assigned_units?.includes(unitId) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin: profile?.role === 'admin' || false,
        isStoreManager: profile?.role === 'store_manager' || false,
        signOut,
        refreshProfile,
        canAccessUnit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for accessing auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}