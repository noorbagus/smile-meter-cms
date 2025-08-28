// pages/_app.js - Fixed with debounced navigation
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import '../styles/globals.css';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

// Debounce utility to prevent rapid navigation
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // Debounced redirect to prevent throttling
  const debouncedRedirect = debounce((path) => {
    if (!isRedirecting) {
      setIsRedirecting(true);
      router.push(path).finally(() => {
        setTimeout(() => setIsRedirecting(false), 1000);
      });
    }
  }, 300);

  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          if (mounted) setProfile(userProfile);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          if (mounted) setProfile(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          // Use debounced redirect to prevent throttling
          debouncedRedirect('/login');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    if (isRedirecting) return;
    
    try {
      setIsRedirecting(true);
      
      // Clear state first
      setUser(null);
      setProfile(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout error:', error);
      
      // Force redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      isRedirecting,
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