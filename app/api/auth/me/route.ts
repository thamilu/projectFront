/**
 * Current User Information Endpoint - GET /api/auth/me
 * 
 * Returns information about the currently authenticated user from NextAuth session.
 * 
 * Security:
 * - Uses NextAuth getServerSession for server-side session validation
 * - Token expiration handled by NextAuth jwt() callback
 * - No manual refresh - NextAuth handles token lifecycle
 * - Cache-control headers (private, no-store)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRequestLogger } from '@/core/telemetry/logger';
import { decodeJwt } from 'jose';


/**
 * GET /api/auth/me
 * 
 * Returns current user information from NextAuth session or accessToken cookie
 * 
 * Response (200):
 * `json
 * {
 *   "id": "user-123",
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "roles": ["customer"]
 * }
 * `
 * 
 * Response (401):
 * `json
 * {
 *   "error": "Unauthorized",
 *   "message": "No active session"
 * }
 * `
 */
export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const log = getRequestLogger(requestId);

  try {
    // 1. Try Auth.js session first
    const session = await auth();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user = session?.user as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let roles = (session as any)?.roles || [];

    // Diagnostics to return to client
    // diagnostics type definition is loose to collect various info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diagnostics: any = {
      fromSession: !!session,
      sessionRoles: roles.length,
      cookieFound: false,
      cookieTokenLength: 0,
      decodedSub: null,
      decodingError: null,
      claimsFound: [],
      allCookies: req.cookies.getAll().map(c => c.name) // Add this line
    };

    // ❌ CRITICAL: Check for refresh errors from NextAuth
    // If the token refresh failed, we must return 401 so the client logs out
    if ((session as any)?.error === 'RefreshAccessTokenError') {
      log.warn('Session has refresh token error, returning 401', { requestId });
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Session expired (RefreshAccessTokenError)',
          _diagnostics: diagnostics
        },
        { status: 401 }
      );
    }

    // CRITICAL FIX: If session exists but has NO roles, we must check the cookie OR header
    // because the custom login flow doesn't update the NextAuth session.
    if (!user || !roles || roles.length === 0) {
      let accessToken = req.cookies.get('accessToken')?.value;
      
      // Fallback: Check Authorization header (Bearer token) if cookie is missing/empty
      if (!accessToken) {
        const authHeader = req.headers.get('authorization');
        if (process.env.NODE_ENV !== 'production') {
            /* eslint-disable no-console */
           console.log('[API/ME] Checking Auth Header:', authHeader ? 'Present' : 'Missing');
           if (authHeader) console.log('[API/ME] Auth Header starts with:', authHeader.substring(0, 15));
            /* eslint-enable no-console */
        }
        if (authHeader?.startsWith('Bearer ')) {
           accessToken = authHeader.substring(7);
           if (process.env.NODE_ENV !== 'production') {
             // eslint-disable-next-line no-console
             console.log('[API/ME] Extracted token from header. Length:', accessToken.length);
           }
        }
      }

      diagnostics.cookieFound = !!accessToken;
      
      if (accessToken) {
        diagnostics.cookieTokenLength = accessToken.length;
        try {
          const decoded = decodeJwt(accessToken);
          log.info('Decoded accessToken cookie', { requestId, sub: decoded.sub });
          
          diagnostics.decodedSub = decoded.sub;
          diagnostics.claimsFound = Object.keys(decoded);

          // Map claims to user object
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const realmRoles = (decoded.realm_access as any)?.roles || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resourceAccess = (decoded.resource_access as any) || {};
          
          // Try to gather roles from all possible locations
          const decodedRoles = [
              ...(decoded.roles as string[] || []),
              ...realmRoles,
              // Flatten resource_access roles
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...Object.values(resourceAccess).flatMap((r: any) => r.roles || [])
          ];
          
          // If we found a valid user in the token
          if (decoded.sub) {
             user = {
               id: decoded.sub,
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               email: (decoded.email as string) || (decoded as any).preferred_username,
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               name: (decoded.name as string) || (decoded as any).given_name,
             };
             roles = Array.from(new Set(decodedRoles)); // Dedupe
          }
        } catch (e) {
          log.warn('Failed to decode accessToken cookie', { requestId, error: String(e) });
          diagnostics.decodingError = String(e);
        }
      }
    }

    if (!user) {
      log.info('User info request - no session or valid cookie', { requestId });
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'No active session',
          _diagnostics: diagnostics
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'private, no-store, no-cache, must-revalidate',
            'X-Request-ID': requestId,
          },
        }
      );
    }

    const userData = {
      id: user.id || user.sub,
      email: user.email,
      name: user.name,
      roles: roles,
      _diagnostics: diagnostics
    };

    log.info('User info retrieved', { 
      requestId, 
      userId: userData.id,
      rolesCount: roles.length
    });

    return NextResponse.json(userData, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    log.error('Error fetching user info', { 
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch user information',
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          'X-Request-ID': requestId,
        },
      }
    );
  }
}
