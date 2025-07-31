'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  console.log('[LoginPage] Rendering login page');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/dashboard';

  useEffect(() => {
    console.log('[LoginPage] useEffect running', {
      authLoading,
      hasUser: !!user,
      redirectTo
    });

    // Check if user is already authenticated
    if (!authLoading && user) {
      console.log('[LoginPage] User already authenticated, redirecting...', { redirectTo });
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Login form submitted', { email });
    setError(null);
    setIsLoading(true);

    try {
      console.log('[LoginPage] Attempting sign in');
      const { error, success } = await signIn(email, password);
      
      if (error) {
        console.error('[LoginPage] Sign in failed:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      if (success) {
        console.log('[LoginPage] Sign in successful, redirecting to:', redirectTo);
        router.push(redirectTo);
      }
    } catch (err: any) {
      console.error('[LoginPage] Exception during sign in:', err);
      setError(err.message || 'An error occurred during sign in');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    console.log('[LoginPage] Auth still loading, showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, don't render the login form
  if (user) {
    console.log('[LoginPage] User is authenticated, nothing to render (redirecting)');
    return null;
  }

  console.log('[LoginPage] Rendering login form');
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
                onChange={(e) => {
                  console.log('[LoginPage] Email input changed');
                  setEmail(e.target.value);
                }}
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
                onChange={(e) => {
                  console.log('[LoginPage] Password input changed');
                  setPassword(e.target.value);
                }}
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

          {/* Debug info - remove in production */}
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-500">Debug: Redirect to: {redirectTo}</p>
          </div>
        </form>
      </div>
    </div>
  );
}