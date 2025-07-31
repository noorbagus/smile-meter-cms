// components/debug/auth-debug.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runDebugChecks = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        },
        tests: []
      };

      try {
        // Test 1: Supabase connection
        console.log('[DEBUG] Testing Supabase connection...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        info.tests.push({
          name: 'Supabase Connection',
          status: sessionError ? 'Error' : 'Success',
          details: sessionError ? sessionError.message : 'Connected',
          data: sessionData?.session ? {
            userId: sessionData.session.user.id,
            email: sessionData.session.user.email
          } : null
        });

        // Test 2: Database access
        console.log('[DEBUG] Testing database access...');
        const { data: dbTest, error: dbError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        info.tests.push({
          name: 'Database Access',
          status: dbError ? 'Error' : 'Success',
          details: dbError ? dbError.message : 'Database accessible',
          error: dbError
        });

        // Test 3: Check if user profile exists
        if (sessionData?.session?.user) {
          console.log('[DEBUG] Testing user profile...');
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();
          
          info.tests.push({
            name: 'User Profile',
            status: userError ? 'Error' : 'Success',
            details: userError ? userError.message : 'Profile found',
            data: userData
          });
        }

      } catch (error: any) {
        console.error('[DEBUG] Error during tests:', error);
        info.tests.push({
          name: 'General Error',
          status: 'Error',
          details: error.message
        });
      }

      setDebugInfo(info);
      setIsLoading(false);
    };

    runDebugChecks();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p>Running debug checks...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border rounded max-w-4xl mx-auto mt-4">
      <h2 className="text-lg font-bold mb-4">Authentication Debug Info</h2>
      
      {/* Environment Check */}
      <div className="mb-4 p-3 bg-white border rounded">
        <h3 className="font-semibold mb-2">Environment Variables</h3>
        <div className="space-y-1 text-sm">
          <p>Supabase URL: <span className={debugInfo.environment.supabaseUrl === 'Set' ? 'text-green-600' : 'text-red-600'}>{debugInfo.environment.supabaseUrl}</span></p>
          <p>Supabase Key: <span className={debugInfo.environment.supabaseKey === 'Set' ? 'text-green-600' : 'text-red-600'}>{debugInfo.environment.supabaseKey}</span></p>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {debugInfo.tests?.map((test: any, index: number) => (
          <div key={index} className="p-3 bg-white border rounded">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{test.name}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                test.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {test.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{test.details}</p>
            {test.data && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(test.data, null, 2)}
              </pre>
            )}
            {test.error && (
              <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-auto text-red-700">
                {JSON.stringify(test.error, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 space-x-2">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          Refresh
        </button>
        <button
          onClick={() => window.location.href = '/test-dashboard'}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm"
        >
          Test Dashboard (No Auth)
        </button>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}