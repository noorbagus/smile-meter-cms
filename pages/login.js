// pages/login.js - Complete with auto redirect and login form
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './_app';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { user, profile, loading, isRedirecting } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('cs@hpm-cyberpark.com');
  const [password, setPassword] = useState('cyberpark');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Skip redirect during auth loading or if already redirecting
    if (loading || isRedirecting) return;

    // If user is logged in, redirect to appropriate dashboard with delay
    if (user && profile) {
      const targetPath = profile.role === 'admin' ? '/dashboard' : '/cs-dashboard';
      // Add small delay to prevent race condition with logout
      setTimeout(() => {
        router.replace(targetPath);
      }, 100);
    }
  }, [user, profile, loading, isRedirecting, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        setError('Profile not found');
        return;
      }

      // Redirect will be handled by useEffect above
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Show loading while checking auth or redirecting
  if (loading || (user && profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {user && profile ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show login form only if no user
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div 
            className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center"
            style={{backgroundColor: '#2a93ce'}}
          >
            <span className="text-white font-bold text-xl">SM</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Smile Meter Stock Manager</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full text-white py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: '#2a93ce'}}
          >
            {loginLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}