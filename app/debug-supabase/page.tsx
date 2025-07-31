// app/debug-supabase/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugSupabase() {
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const results = [];
      
      try {
        // Test 1: Basic connection
        results.push({
          test: 'Basic Connection',
          status: 'success',
          message: 'Supabase client initialized'
        });

        // Test 2: Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        results.push({
          test: 'Get Session',
          status: sessionError ? 'error' : 'success',
          message: sessionError ? sessionError.message : sessionData.session ? 'Session exists' : 'No session',
          data: sessionData.session ? {
            user_id: sessionData.session.user.id,
            email: sessionData.session.user.email
          } : null
        });

        // Test 3: Database connection
        const { data: dbData, error: dbError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        results.push({
          test: 'Database Connection',
          status: dbError ? 'error' : 'success',
          message: dbError ? dbError.message : 'Database accessible'
        });

        // Test 4: Check if user profile exists
        if (sessionData.session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();
          
          results.push({
            test: 'User Profile',
            status: userError ? 'error' : 'success',
            message: userError ? `Profile not found: ${userError.message}` : 'Profile exists',
            data: userData
          });
        }

      } catch (error: any) {
        results.push({
          test: 'General Error',
          status: 'error',
          message: error.message
        });
      }

      setTests(results);
      setIsLoading(false);
    };

    runTests();
  }, []);

  const createTestUser = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: 'test123456'
      });

      if (authError) throw authError;

      if (authData.user && authData.user.email) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) throw profileError;

        alert('Test user created successfully! Email: admin@test.com, Password: test123456');
      }
    } catch (error: any) {
      alert('Error creating test user: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supabase Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> 
              <span className="ml-2 font-mono">{process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</span>
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> 
              <span className="ml-2 font-mono">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
                  'Not set'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Connection Tests</h2>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>Running tests...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{test.test}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      test.status === 'success' ? 'bg-green-100 text-green-800' :
                      test.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                  {test.data && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={createTestUser}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Test User (admin@test.com)
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="ml-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}