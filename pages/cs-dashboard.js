import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import '../styles/globals.css';

// Auth Context
const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  refreshProfile: () => {},
  supabase
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get user profile
  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
          setLoading(false);
          
          // Redirect based on role
          if (userProfile?.role === 'admin') {
            router.push('/dashboard');
          } else if (userProfile?.role === 'customer_service') {
            router.push('/cs-dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
          if (router.pathname !== '/login') {
            router.push('/login');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setLoading(false);
        throw error;
      }

      // Profile will be set in the auth state change listener
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Main App Component
export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

// Export utilities for pages
export { supabase, useAuth };