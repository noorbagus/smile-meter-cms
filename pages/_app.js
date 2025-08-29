// pages/_app.js - Updated with SSR approach
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '../utils/supabase/client';
import '../styles/globals.css';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const getUserProfile = async (userId) => {
    try {
      console.log('👤 Getting profile for:', userId);
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile timeout')), 8000)
      );
      
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error('❌ Profile error:', error);
        return null;
      }
      
      console.log('✅ Profile found:', data);
      return data;
    } catch (error) {
      console.error('❌ Profile fetch timeout:', error);
      // Auto sign out on timeout
      await supabase.auth.signOut();
      return null;
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Try to get profile with timeout
          const userProfile = await getUserProfile(session.user.id);
          
          if (userProfile) {
            setProfile(userProfile);
          } else {
            // Fallback: create basic profile from session data
            const fallbackProfile = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email,
              role: session.user.email.includes('admin') ? 'admin' : 'customer_service'
            };
            setProfile(fallbackProfile);
            console.log('🔄 Using fallback profile:', fallbackProfile);
          }
        }
      } catch (error) {
        console.error('❌ Session init failed:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // Skip profile fetch for now, use fallback
          const fallbackProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            role: session.user.email.includes('admin') ? 'admin' : 'customer_service'
          };
          setProfile(fallbackProfile);
          console.log('🔄 Using fallback profile for signed in:', fallbackProfile);
          
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

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    await supabase.auth.signOut();
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