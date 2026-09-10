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
    setLoading((prev) => ({ ...prev, [key]: true }));

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

      const data = (await response.ok) ? await response.json().catch(() => null) : null;

      setResults((prev) => ({
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
      setResults((prev) => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  /**
   * Test with explicit Bearer token
   */
  const testWithToken = async (endpoint: string) => {
    const key = `${endpoint}-token`;
    setLoading((prev) => ({ ...prev, [key]: true }));

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
        Authorization: `Bearer ${accessToken}`,
      };

      const url = `/api${endpoint}`;
      console.log(`Calling with Bearer token: ${url}`);

      const apiResponse = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await apiResponse.json().catch(() => null);

      setResults((prev) => ({
        ...prev,
        [key]: {
          success: apiResponse.ok,
          data,
          status: apiResponse.status,
        },
      }));

      console.log(`Response from ${endpoint} (with token):`, {
        status: apiResponse.status,
        data,
      });
    } catch (error) {
      console.error(`Error calling ${endpoint} with token:`, error);
      setResults((prev) => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <h1 className="mb-4 text-3xl font-bold">Backend API Test</h1>

          {/* Auth Status */}
          <div
            className={`mb-6 rounded-lg p-4 ${
              isAuthenticated
                ? 'border border-green-200 bg-green-50'
                : 'border border-yellow-200 bg-yellow-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              ></span>
              <h2 className="text-lg font-semibold">
                {isAuthenticated ? '✅ Authenticated' : '⚠️ Not Authenticated'}
              </h2>
            </div>
            {isAuthenticated && session?.user && (
              <div className="mt-2 text-sm">
                <p>
                  <strong>User:</strong> {session.user.name || session.user.email}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
                {(session as any).roles && (
                  <p>
                    <strong>Roles:</strong> {(session as any).roles.join(', ')}
                  </p>
                )}
              </div>
            )}
            {!isAuthenticated && (
              <div className="mt-2">
                <a
                  href="/api/auth/signin/keycloak"
                  className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Sign In with Keycloak
                </a>
              </div>
            )}
          </div>

          {/* Test Endpoints */}
          <div className="space-y-4">
            <h2 className="mb-4 text-xl font-semibold">Test API Endpoints</h2>

            {/* Public Endpoint */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Public Endpoint (No Auth Required)</h3>
              <button
                onClick={() => testApiCall('/products/featured', false)}
                disabled={loading['/products/featured']}
                className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:bg-gray-400"
              >
                {loading['/products/featured'] ? 'Testing...' : 'GET /api/products/featured'}
              </button>
              {results['/products/featured'] && (
                <ResultDisplay result={results['/products/featured']} />
              )}
            </div>

            {/* Protected Endpoint - Cookie Auth */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Protected Endpoint (Cookie Auth)</h3>
              <button
                onClick={() => testApiCall('/products')}
                disabled={loading['/products'] || !isAuthenticated}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading['/products'] ? 'Testing...' : 'GET /api/products'}
              </button>
              {!isAuthenticated && (
                <p className="mt-2 text-sm text-red-600">⚠️ Please sign in first</p>
              )}
              {results['/products'] && <ResultDisplay result={results['/products']} />}
            </div>

            {/* Protected Endpoint - Bearer Token */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Protected Endpoint (Bearer Token)</h3>
              <button
                onClick={() => testWithToken('/products')}
                disabled={loading['/products-token'] || !isAuthenticated}
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {loading['/products-token']
                  ? 'Testing...'
                  : 'GET /api/products (with Bearer token)'}
              </button>
              {!isAuthenticated && (
                <p className="mt-2 text-sm text-red-600">⚠️ Please sign in first</p>
              )}
              {results['/products-token'] && <ResultDisplay result={results['/products-token']} />}
            </div>

            {/* Admin Endpoint */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Admin Endpoint (Requires ADMIN role)</h3>
              <button
                onClick={() => testWithToken('/admin/users')}
                disabled={loading['/admin/users-token'] || !isAuthenticated}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
              >
                {loading['/admin/users-token'] ? 'Testing...' : 'GET /api/admin/users'}
              </button>
              {!isAuthenticated && (
                <p className="mt-2 text-sm text-red-600">⚠️ Please sign in first</p>
              )}
              {results['/admin/users-token'] && (
                <ResultDisplay result={results['/admin/users-token']} />
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold">📋 Testing Instructions</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm">
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
    <div
      className={`mt-3 rounded p-3 text-sm ${
        result.success ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
          {result.success ? '✅ Success' : '❌ Failed'}
        </span>
        {result.status && (
          <span className="rounded bg-gray-200 px-2 py-1 text-xs">HTTP {result.status}</span>
        )}
      </div>
      {result.error && (
        <p className="mb-2 text-red-700">
          <strong>Error:</strong> {result.error}
        </p>
      )}
      {result.data && (
        <details className="cursor-pointer">
          <summary className="mb-1 font-semibold">Response Data</summary>
          <pre className="max-h-40 overflow-auto rounded border bg-white p-2 text-xs">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
