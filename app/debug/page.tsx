// app/debug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runDebugChecks = async () => {
      console.log('[DEBUG] Starting debug checks...');
      
      const info: any = {
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
        },
        tests: []
      };

      try {
        // Test 1: Basic connection
        console.log('[DEBUG] Testing basic connection...');
        info.tests.push({
          name: 'Supabase Client',
          status: 'Success',
          details: 'Client initialized'
        });

        // Test 2: Get session
        console.log('[DEBUG] Getting session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        info.tests.push({
          name: 'Get Session',
          status: sessionError ? 'Error' : 'Success',
          details: sessionError ? sessionError.message : sessionData?.session ? 'Session exists' : 'No session',
          data: sessionData?.session ? {
            userId: sessionData.session.user.id,
            email: sessionData.session.user.email
          } : null
        });

        // Test 3: Database connection
        console.log('[DEBUG] Testing database...');
        const { data: dbTest, error: dbError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        info.tests.push({
          name: 'Database Connection',
          status: dbError ? 'Error' : 'Success',
          details: dbError ? dbError.message : 'Database accessible',
          error: dbError
        });

        // Test 4: Try to create a test user (if no session)
        if (!sessionData?.session) {
          console.log('[DEBUG] No session found, testing user creation...');
          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: 'test@example.com',
              password: 'testpassword123',
            });
            
            info.tests.push({
              name: 'Test User Creation',
              status: signUpError ? 'Error' : 'Success',
              details: signUpError ? signUpError.message : 'User creation works',
              data: signUpData
            });
          } catch (err: any) {
            info.tests.push({
              name: 'Test User Creation',
              status: 'Error',
              details: err.message
            });
          }
        }

      } catch (error: any) {
        console.error('[DEBUG] Error during tests:', error);
        info.tests.push({
          name: 'General Error',
          status: 'Error',
          details: error.message
        });
      }

      console.log('[DEBUG] Debug info:', info);
      setDebugInfo(info);
      setIsLoading(false);
    };

    runDebugChecks();
  }, []);

  const createTestUser = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: 'test123456'
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: 'admin@test.com',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) throw profileError;
      }

      alert('Test user created! Email: admin@test.com, Password: test123456');
    } catch (error: any) {
      alert('Error creating test user: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
          <div className="bg-white p-4 rounded border">
            <p>Running debug checks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
        
        {/* Current URL */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm">
            <strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}
          </p>
        </div>

        {/* Environment Variables */}
        <div className="mb-4 p-4 bg-white border rounded">
          <h2 className="font-semibold mb-2">Environment Variables</h2>
          <div className="space-y-1 text-sm">
            <p>NEXT_PUBLIC_SUPABASE_URL: {debugInfo.environment?.supabaseUrl}</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {debugInfo.environment?.supabaseKey}</p>
          </div>
        </div>

        {/* Test Results */}
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Test Results</h2>
          <div className="space-y-3">
            {debugInfo.tests?.map((test: any, index: number) => (
              <div key={index} className="p-3 bg-white border rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{test.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    test.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {test.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{test.details}</p>
                {test.data && (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                )}
                {test.error && (
                  <pre className="text-xs bg-red-50 p-2 rounded overflow-auto text-red-700">
                    {JSON.stringify(test.error, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Refresh
          </button>
          <button
            onClick={() => window.location.href = '/test-dashboard'}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Test Dashboard (No Auth)
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Go to Login
          </button>
          <button
            onClick={createTestUser}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            Create Test User
          </button>
        </div>

        {/* Raw Debug Data */}
        <div className="mt-6 p-4 bg-gray-100 border rounded">
          <h2 className="font-semibold mb-2">Raw Debug Data</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}