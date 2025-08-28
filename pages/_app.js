import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import '../styles/globals.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Auth Context
const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  refreshProfile: () => {}
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

      if (error || !data) {
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
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
          
          // Redirect based on role
          if (userProfile?.role === 'admin') {
            router.push('/dashboard');
          } else if (userProfile?.role === 'customer_service') {
            router.push('/cs-dashboard');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      router.push('/login');
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

// Route Protection Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push('/login');
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
        // Redirect to appropriate dashboard based on role
        if (profile.role === 'admin') {
          router.push('/dashboard');
        } else if (profile.role === 'customer_service') {
          router.push('/cs-dashboard');
        } else {
          router.push('/login');
        }
        return;
      }
    }
  }, [user, profile, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return children;
};

// Main App Component
export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';
  const isPublicRoute = ['/login', '/'].includes(router.pathname);

  // Global loading state
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setGlobalLoading(true);
    const handleComplete = () => setGlobalLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <AuthProvider>
      {globalLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-600 z-50">
          <div className="h-full bg-blue-800 animate-pulse"></div>
        </div>
      )}
      
      {isPublicRoute ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute 
          allowedRoles={
            router.pathname === '/dashboard' ? ['admin'] :
            router.pathname === '/cs-dashboard' ? ['customer_service'] :
            []
          }
        >
          <Component {...pageProps} />
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}

// Export utilities for pages
export { supabase, ProtectedRoute };