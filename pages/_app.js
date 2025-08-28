// pages/_app.js - Fixed logout redirect issue
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import '../styles/globals.css';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const getUserProfile = async (userId) => {
    try {
      console.log('👤 Getting profile for:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile error:', error);
        return null;
      }
      console.log('✅ Profile found:', data);
      return data;
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Initial session:', session);
        
        if (session?.user && !isSigningOut && isMounted) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };

  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user && !isSigningOut) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
          // Don't redirect here - let signIn handle it
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out, clearing state and redirecting to login');
          setUser(null);
          setProfile(null);
          setIsSigningOut(false);
          
          // Force redirect to login
          window.location.href = '/login';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isSigningOut, router]);

  const signIn = async (email, password) => {
    try {
      console.log('🔐 Starting login:', email);
      setIsSigningOut(false); // Reset signing out state
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Auth error:', error);
        throw error;
      }

      console.log('✅ Auth success:', data);
      
      if (data.user) {
        console.log('👤 Fetching profile for:', data.user.id);
        const profile = await getUserProfile(data.user.id);
        
        if (profile) {
          setUser(data.user);
          setProfile(profile);
          
          console.log('🎯 Redirecting based on role:', profile.role);
          // Force redirect without waiting for auth state change
          setTimeout(() => {
            if (profile.role === 'admin') {
              window.location.href = '/dashboard';
            } else if (profile.role === 'customer_service') {
              window.location.href = '/cs-dashboard';
            }
          }, 100);
          
          return { success: true, data };
        } else {
          console.error('❌ No profile found');
          return { success: false, error: 'Profile not found' };
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    console.log('🚪 Starting sign out process');
    setIsSigningOut(true); // Set signing out flag first
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Even if sign out fails, clear local state and redirect
      setUser(null);
      setProfile(null);
      setIsSigningOut(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signOut,
      supabase
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}