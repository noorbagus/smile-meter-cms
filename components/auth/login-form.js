// components/auth/login-form.js - Enhanced Debug Version
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Bug } from 'lucide-react';
import { useAuth } from '../../pages/_app';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [showDebug, setShowDebug] = useState(true);
  
  const { signIn, supabase } = useAuth();
  const router = useRouter();

  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setDebugInfo(prev => prev + `\n[${timestamp}] ${message}`);
  };

  const testConnection = async () => {
    addDebug('🔌 Testing Supabase connection...');
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        addDebug(`❌ Connection test failed: ${error.message}`);
      } else {
        addDebug(`✅ Connection OK, found ${data?.length || 0} profiles`);
      }
    } catch (err) {
      addDebug(`❌ Connection error: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo(''); // Clear previous debug

    addDebug('🚀 Login form submitted');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      addDebug('❌ Validation failed: Empty fields');
      setLoading(false);
      return;
    }

    addDebug(`📧 Email: ${formData.email}`);
    addDebug(`🔑 Password length: ${formData.password.length}`);

    // Test connection first
    await testConnection();

    addDebug('🔐 Starting authentication...');
    const result = await signIn(formData.email, formData.password);

    if (!result.success) {
      addDebug(`❌ Login failed: ${result.error}`);
      setError(result.error || 'Login failed');
    } else {
      addDebug('✅ Login successful!');
    }
    
    setLoading(false);
  };

  // Quick test accounts
  const fillTestAccount = (type) => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@hpm-smile-meter.com',
        password: 'admin123'
      });
    } else {
      setFormData({
        email: 'cs@hpm-cyberpark.com',
        password: 'cs123456'
      });
    }
    addDebug(`🎯 Filled ${type} test credentials`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            HPM Stock Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        {/* Debug Panel */}
        {showDebug && (
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                <span className="text-green-300">Debug Console</span>
              </div>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {debugInfo || 'Waiting for login attempt...'}
              </pre>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700 flex gap-2">
              <button
                onClick={() => fillTestAccount('admin')}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Admin
              </button>
              <button
                onClick={() => fillTestAccount('cs')}
                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
              >
                CS
              </button>
              <button
                onClick={testConnection}
                className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
              >
                Test DB
              </button>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="pl-10 pr-10 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {!showDebug && (
          <button
            onClick={() => setShowDebug(true)}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-700"
          >
            Show Debug Console
          </button>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Stock Management System for HPM Units
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;