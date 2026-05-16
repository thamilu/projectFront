/**
 * Logout API Route - POST /api/auth/logout
 * 
 * Clears authentication cookies and invalidates backend session with security:
 * - CSRF protection (origin + custom header validation)
 * - Session validation
 * - Backend token invalidation (best effort)
 * - Audit logging
 * - Request ID correlation
 * - Cache-control headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/observability/logger';
import { logoutFromKeycloak } from '@/lib/auth/token-service';

// ============================================================================
// Environment Configuration
// ============================================================================

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8082';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const BACKEND_LOGOUT_TIMEOUT_MS = parseInt(process.env.LOGOUT_TIMEOUT_MS || '5000', 10);

// ============================================================================
// Constants
// ============================================================================

/**
 * All authentication-related cookies to clear on logout
 */
const AUTH_COOKIES = ['accessToken', 'refreshToken', 'isAuthenticated', 'sessionId', 'userId', 'next-auth.session-token', 'next-auth.callback-url', 'next-auth.csrf-token'] as const;

const NEXTAUTH_COOKIES = [
  // Dev / non-secure
  'next-auth.session-token',
  'next-auth.callback-url',
  'next-auth.csrf-token',
  'next-auth.pkce.code_verifier',
  'next-auth.state',
  'next-auth.nonce',
  // Secure cookie variants (prod)
  '__Secure-next-auth.session-token',
  '__Secure-next-auth.callback-url',
  '__Host-next-auth.csrf-token',
] as const;

// ============================================================================
// Helper Functions (Hoisted for Performance)
// ============================================================================

/**
 * Validates request origin for CSRF protection
 */
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // No origin/referer is suspicious for POST from browsers
  if (!origin && !referer) {
    // Allow for non-browser clients (mobile apps, etc.)
    return true;
  }
  
  try {
    const appOrigin = new URL(APP_URL).origin;
    
    if (origin) {
      return origin === appOrigin;
    }
    
    if (referer) {
      const refererOrigin = new URL(referer).origin;
      return refererOrigin === appOrigin;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Attempts to invalidate token on backend (best effort, non-blocking)
 */
async function invalidateBackendSession(accessToken: string, requestId: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_LOGOUT_TIMEOUT_MS);
  
  try {
    await fetch(`${BACKEND_API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Request-ID': requestId,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    logger.debug('Backend session invalidated', { requestId });
  } catch (error) {
    clearTimeout(timeoutId);
    // Don't fail logout - client cookies will still be cleared
    logger.warn('Backend session invalidation failed (non-blocking)', { 
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Clears all authentication cookies from response
 */
/**
 * Clears all authentication cookies from response
 */
function clearAuthCookies(response: NextResponse, request: NextRequest): void {
  // 1. Clear known fixed cookies
  AUTH_COOKIES.forEach(cookieName => {
    response.cookies.delete(cookieName);
  });

  // 2. Dynamically clear all NextAuth cookies (including chunked ones)
  // NextAuth splits large cookies into chunks (e.g., next-auth.session-token.0, next-auth.session-token.1)
  // We must find and delete ALL of them to effectively log out.
  const allCookies = request.cookies.getAll();
  
  allCookies.forEach(cookie => {
    const name = cookie.name;
    
    // Check for NextAuth patterns
    if (
      name.startsWith('next-auth.') ||
      name.startsWith('__Secure-next-auth.') ||
      name.startsWith('__Host-next-auth.')
    ) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[Logout] Clearing cookie: ${name}`);
      }
      
      response.cookies.delete(name);
    }
  });
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Generate request ID for correlation
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  
  try {
    // -------------------------------------------------------------------------
    // 1. CSRF Protection (Origin Validation)
    // -------------------------------------------------------------------------
    if (!isValidOrigin(request)) {
      logger.warn('Logout rejected - invalid origin', { 
        requestId,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      });
      return NextResponse.json(
        { error: 'Invalid request origin', requestId },
        { 
          status: 403,
          headers: { 'X-Request-ID': requestId },
        }
      );
    }
    
    // -------------------------------------------------------------------------
    // 2. Additional CSRF Protection (Custom Header Check)
    // -------------------------------------------------------------------------
    // For browser requests, require X-Requested-With header
    // This cannot be set by simple CORS requests from other origins
    const hasCustomHeader = request.headers.get('x-requested-with') === 'XMLHttpRequest';
    const hasOriginHeader = request.headers.get('origin') !== null;
    
    // If request has origin (from browser), require custom header
    if (hasOriginHeader && !hasCustomHeader) {
      logger.warn('Logout rejected - missing CSRF header', { requestId });
      return NextResponse.json(
        { error: 'Missing required security header', requestId },
        { 
          status: 403,
          headers: { 'X-Request-ID': requestId },
        }
      );
    }
    
    // -------------------------------------------------------------------------
    // 3. Session Validation
    // -------------------------------------------------------------------------
    const session = await auth();
    const legacyAccessToken = request.cookies.get('accessToken')?.value;
    const legacyRefreshToken = request.cookies.get('refreshToken')?.value;
    const nextAuthToken = session as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextAuthAccessToken = nextAuthToken?.accessToken as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextAuthRefreshToken = nextAuthToken?.refreshToken as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextAuthIdToken = nextAuthToken?.idToken as string | undefined;

    const accessToken = legacyAccessToken ?? nextAuthAccessToken;
    const refreshToken = legacyRefreshToken ?? nextAuthRefreshToken;

    const wasAuthenticated = !!(accessToken || refreshToken || nextAuthToken);
    
    if (!wasAuthenticated) {
      logger.info('Logout - no active session', { requestId });
    }
    
    // -------------------------------------------------------------------------
    // 4. Backend Session Invalidation (Best Effort)
    // -------------------------------------------------------------------------
    if (accessToken) {
      // Non-blocking: attempt to invalidate on backend
      // Don't wait for completion - prioritize client-side cleanup
      invalidateBackendSession(accessToken, requestId).catch(() => {
        // Already logged in invalidateBackendSession
      });
    }

    // -------------------------------------------------------------------------
    // 4b. Revoke Keycloak Refresh Token (Best Effort)
    // -------------------------------------------------------------------------
    // This is separate from browser SSO logout; it prevents refresh-token reuse.
    if (nextAuthRefreshToken) {
      const keycloakIssuer = process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/eshop';
      const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'eshop-frontend';
      const result = await logoutFromKeycloak(
        nextAuthRefreshToken,
        { issuer: keycloakIssuer, clientId: keycloakClientId },
        2
      );

      if (!result.success) {
        logger.warn('Keycloak refresh token revocation failed (non-blocking)', {
          requestId,
          error: result.error,
        });
      }
    }
    
    // -------------------------------------------------------------------------
    // 5. Audit Logging
    // -------------------------------------------------------------------------
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent')?.slice(0, 200) || 'unknown';
    
    logger.info('User logout', {
      requestId,
      wasAuthenticated,
      hadAccessToken: !!accessToken,
      hadRefreshToken: !!refreshToken,
      ipAddress: clientIp,
      userAgent,
      // Never log actual token values
    });
    
    // -------------------------------------------------------------------------
    // 6. Parse Optional Redirect
    // -------------------------------------------------------------------------
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo');
    
    // Validate redirect URL (must be relative path)
    let validatedRedirect: string | undefined;
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      // Additional safety checks
      if (redirectTo.length <= 2048 && !redirectTo.includes('\0')) {
        validatedRedirect = redirectTo;
      }
    }
    
    // -------------------------------------------------------------------------
    // 7. Build Response and Clear Cookies
    // -------------------------------------------------------------------------
    const responseBody: {
      success: boolean;
      message: string;
      wasAuthenticated: boolean;
      requestId: string;
      redirectTo?: string;
      keycloakLogoutUrl?: string;
      broadcast?: {
        channel: string;
        event: string;
      };
    } = {
      success: true,
      message: 'Logged out successfully',
      wasAuthenticated,
      requestId,
    };
    
    // Include redirect if valid
    if (validatedRedirect) {
      responseBody.redirectTo = validatedRedirect;
    }
    
    // Construct Keycloak Logout URL for client-side redirection
    // This is required to clear the user's SSO session in the browser
    const keycloakIssuer = process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/eshop';
    const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || 'eshop-frontend';
    // IMPORTANT:
    // Keycloak enforces "Valid post logout redirect URIs" per client. If we send
    // an unregistered URI, Keycloak will show "Invalid redirect uri" and block logout.
    // To avoid hard failures, only include post_logout_redirect_uri when explicitly configured.
    const configuredPostLogoutRedirectUri =
      process.env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI ||
      (process.env.NODE_ENV !== 'production' ? APP_URL : undefined);
    
    // Ensure issuer doesn't have trailing slash for clean URL construction
    const cleanIssuer = keycloakIssuer.replace(/\/$/, '');
    
    const logoutParams = new URLSearchParams();
    logoutParams.set('client_id', keycloakClientId);
    if (configuredPostLogoutRedirectUri) {
      logoutParams.set('post_logout_redirect_uri', configuredPostLogoutRedirectUri);
    }

    let keycloakLogoutUrl = `${cleanIssuer}/protocol/openid-connect/logout?${logoutParams.toString()}`;

    // Retrieve ID Token from NextAuth JWT to provide hint to Keycloak (best effort)
    // This avoids user interaction during logout (no confirmation prompt in some configs)
    if (nextAuthIdToken) {
      keycloakLogoutUrl += `&id_token_hint=${encodeURIComponent(nextAuthIdToken)}`;
    } else {
      try {
        const session = await auth();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idToken = (session as any)?.idToken as string | undefined;
        if (idToken) {
          keycloakLogoutUrl += `&id_token_hint=${encodeURIComponent(idToken)}`;
        }
      } catch (e) {
        logger.debug('Logout - session lookup for id_token_hint failed (non-blocking)', {
          requestId,
          error: e instanceof Error ? e.message : 'unknown',
        });
      }
    }
    
    logger.info('Generated Keycloak Logout URL', { url: keycloakLogoutUrl });
    responseBody.keycloakLogoutUrl = keycloakLogoutUrl;

    
    // Include broadcast instruction for multi-tab logout sync
    responseBody.broadcast = {
      channel: 'auth-sync',
      event: 'logout',
    };
    
    const response = NextResponse.json(responseBody, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'X-Request-ID': requestId,
      },
    });
    
    // Clear all authentication cookies
    clearAuthCookies(response, request);
    
    return response;
    
  } catch (error: unknown) {
    // -------------------------------------------------------------------------
    // 8. Catch-All Error Handler
    // -------------------------------------------------------------------------
    logger.error('Logout unexpected error', { 
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Still try to clear cookies even on error
    const response = NextResponse.json(
      { 
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout',
        requestId,
      },
      { 
        status: 500,
        headers: { 'X-Request-ID': requestId },
      }
    );
    
    clearAuthCookies(response, request);
    return response;
  }
}

// ============================================================================
// GET Handler (Reject - Logout Must Use POST)
// ============================================================================

/**
 * GET requests not allowed for logout (CSRF vulnerability)
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      message: 'Logout requires POST request',
    },
    { 
      status: 405,
      headers: { 'Allow': 'POST' },
    }
  );
}
