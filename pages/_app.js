// pages/_app.js - Fixed with clear state logout
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
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Initial session:', session);
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      console.log('🔐 Starting login:', email);
      
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
    try {
      console.log('🚪 Starting logout...');
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
      }
      
      // Clear any remaining browser session data
      if (typeof window !== 'undefined') {
        // Clear localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear sessionStorage
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      console.log('✅ State cleared, redirecting...');
      
      // Force full page reload to login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
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