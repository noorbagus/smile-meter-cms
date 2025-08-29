// pages/_app.js - Fixed version untuk reload issue
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
  const [initialized, setInitialized] = useState(false);
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

  // SINGLE useEffect - hanya pakai onAuthStateChange
  useEffect(() => {
    console.log('🔐 Setting up auth listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            console.log('👤 Fetching profile for:', session.user.id);
            
            const userProfile = await getUserProfile(session.user.id);
            setProfile(userProfile);
            
            // Redirect based on role
            if (userProfile && !initialized) {
              const targetPath = userProfile.role === 'admin' ? '/dashboard' : '/cs-dashboard';
              console.log('🎯 Redirecting to:', targetPath);
              
              // Only redirect if not already on target page
              if (router.pathname !== targetPath) {
                setTimeout(() => router.replace(targetPath), 100);
              }
            }
            
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out');
            setUser(null);
            setProfile(null);
            
            // Only redirect to login if not already there.
            if (router.pathname !== '/login') {
              router.replace('/login');
            }
            
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token refreshed');
            // Don't fetch profile again on token refresh if we already have it
            
          } else if (event === 'INITIAL_SESSION') {
            console.log('🔐 Initial session:', session?.user?.email);
            
            if (session?.user) {
              setUser(session.user);
              const userProfile = await getUserProfile(session.user.id);
              setProfile(userProfile);
            }
          }
          
        } catch (error) {
          console.error('❌ Auth state change error:', error);
        } finally {
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - hanya run sekali

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