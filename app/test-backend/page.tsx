/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';



interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export default function TestBackendPage() {
  const { data: session, status } = useSession();
  const [results, setResults] = useState<Record<string, ApiResponse>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  /**
   * Test authenticated API call to backend
   */
  const testApiCall = async (endpoint: string, requiresAuth: boolean = true) => {
    const key = endpoint;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if authenticated and required
      if (requiresAuth && session) {
        // NextAuth stores accessToken in session - we need to get it from the token
        // For now, we'll use the session cookie which backend should validate
        console.log('Session:', session);
      }

      const url = `/api${endpoint}`;
      console.log(`Calling: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Send cookies
      });

      const data = await response.json().catch(() => null);

      setResults(prev => ({
        ...prev,
        [key]: {
          success: response.ok,
          data,
          status: response.status,
        },
      }));

      console.log(`Response from ${endpoint}:`, { status: response.status, data });
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      setResults(prev => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  /**
   * Test with explicit Bearer token
   */
  const testWithToken = async (endpoint: string) => {
    const key = `${endpoint}-token`;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      // Get fresh session to ensure we have latest token
      const response = await fetch('/api/auth/session');
      const sessionData = await response.json();
      
      console.log('Current session data:', sessionData);

      // For NextAuth, we need to access the token from server-side
      // Let's create a helper endpoint to get the access token
      const tokenResponse = await fetch('/api/get-token');
      const { accessToken } = await tokenResponse.json();

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      const url = `/api${endpoint}`;
      console.log(`Calling with Bearer token: ${url}`);
      
      const apiResponse = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await apiResponse.json().catch(() => null);

      setResults(prev => ({
        ...prev,
        [key]: {
          success: apiResponse.ok,
          data,
          status: apiResponse.status,
        },
      }));

      console.log(`Response from ${endpoint} (with token):`, { 
        status: apiResponse.status, 
        data 
      });
    } catch (error) {
      console.error(`Error calling ${endpoint} with token:`, error);
      setResults(prev => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Backend API Test</h1>
          
          {/* Auth Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            isAuthenticated ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${
                isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'
              }`}></span>
              <h2 className="text-lg font-semibold">
                {isAuthenticated ? '✅ Authenticated' : '⚠️ Not Authenticated'}
              </h2>
            </div>
            {isAuthenticated && session?.user && (
              <div className="mt-2 text-sm">
                <p><strong>User:</strong> {session.user.name || session.user.email}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                {(session as any).roles && (
                  <p><strong>Roles:</strong> {(session as any).roles.join(', ')}</p>
                )}
              </div>
            )}
            {!isAuthenticated && (
              <div className="mt-2">
                <a 
                  href="/api/auth/signin/keycloak" 
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sign In with Keycloak
                </a>
              </div>
            )}
          </div>

          {/* Test Endpoints */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Test API Endpoints</h2>

            {/* Public Endpoint */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Public Endpoint (No Auth Required)</h3>
              <button
                onClick={() => testApiCall('/products/featured', false)}
                disabled={loading['/products/featured']}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
              >
                {loading['/products/featured'] ? 'Testing...' : 'GET /api/products/featured'}
              </button>
              {results['/products/featured'] && (
                <ResultDisplay result={results['/products/featured']} />
              )}
            </div>

            {/* Protected Endpoint - Cookie Auth */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Protected Endpoint (Cookie Auth)</h3>
              <button
                onClick={() => testApiCall('/products')}
                disabled={loading['/products'] || !isAuthenticated}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading['/products'] ? 'Testing...' : 'GET /api/products'}
              </button>
              {!isAuthenticated && (
                <p className="text-sm text-red-600 mt-2">⚠️ Please sign in first</p>
              )}
              {results['/products'] && (
                <ResultDisplay result={results['/products']} />
              )}
            </div>

            {/* Protected Endpoint - Bearer Token */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Protected Endpoint (Bearer Token)</h3>
              <button
                onClick={() => testWithToken('/products')}
                disabled={loading['/products-token'] || !isAuthenticated}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {loading['/products-token'] ? 'Testing...' : 'GET /api/products (with Bearer token)'}
              </button>
              {!isAuthenticated && (
                <p className="text-sm text-red-600 mt-2">⚠️ Please sign in first</p>
              )}
              {results['/products-token'] && (
                <ResultDisplay result={results['/products-token']} />
              )}
            </div>

            {/* Admin Endpoint */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Admin Endpoint (Requires ADMIN role)</h3>
              <button
                onClick={() => testWithToken('/admin/users')}
                disabled={loading['/admin/users-token'] || !isAuthenticated}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                {loading['/admin/users-token'] ? 'Testing...' : 'GET /api/admin/users'}
              </button>
              {!isAuthenticated && (
                <p className="text-sm text-red-600 mt-2">⚠️ Please sign in first</p>
              )}
              {results['/admin/users-token'] && (
                <ResultDisplay result={results['/admin/users-token']} />
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">📋 Testing Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Sign in with Keycloak if not already authenticated</li>
              <li>Check browser console for detailed logs</li>
              <li>Check backend terminal for Spring Security logs</li>
              <li>Look for: "Securing GET /api/..." and "JwtAuthenticationProvider"</li>
              <li>Verify roles are extracted from JWT token</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: ApiResponse }) {
  return (
    <div className={`mt-3 p-3 rounded text-sm ${
      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
          {result.success ? '✅ Success' : '❌ Failed'}
        </span>
        {result.status && (
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
            HTTP {result.status}
          </span>
        )}
      </div>
      {result.error && (
        <p className="text-red-700 mb-2"><strong>Error:</strong> {result.error}</p>
      )}
      {result.data && (
        <details className="cursor-pointer">
          <summary className="font-semibold mb-1">Response Data</summary>
          <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
