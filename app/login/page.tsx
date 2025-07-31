'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Debug logging
  useEffect(() => {
    console.log('Login page state:', {
      authLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      redirectTo
    });
  }, [authLoading, user, profile, redirectTo]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user && profile) {
      console.log('User already authenticated, redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  }, [authLoading, user, profile, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log('Attempting login with:', email);

    try {
      const { error, success } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      if (success) {
        console.log('Login successful, will redirect after auth state updates');
        // Don't redirect manually here - let the useEffect handle it
        // after the auth state is properly updated
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'An error occurred during sign in');
      setIsLoading(false);
    }
  };

  // Show loading if auth is still being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 rounded-full border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, show loading while redirecting
  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 rounded-full border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
            <span className="text-white font-bold text-xl">SM</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Smile Meter CMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in with your account
          </p>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
              <p>Has User: {user ? 'Yes' : 'No'}</p>
              <p>Has Profile: {profile ? 'Yes' : 'No'}</p>
              <p>Redirect To: {redirectTo}</p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}