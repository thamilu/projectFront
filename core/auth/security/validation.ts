/**
 * Security Validation Utilities
 * Provides redirect URL validation, HTML escaping, and request validation
 */

import { NextRequest } from 'next/server';

/**
 * Allowed redirect path prefixes (whitelist approach)
 */
const ALLOWED_REDIRECT_PREFIXES = [
  '/',
  '/customer/dashboard',
  '/products',
  '/account',
  '/customer',
  '/admin',
  '/orders',
  '/cart',
  '/auth/popup-finish',
  '/auth/pkce-callback',
] as const;

/**
 * Sensitive paths that should never be redirect targets
 */
const BLOCKED_REDIRECT_PATHS = [
  '/api/',
  '/auth/signout',
  '/auth/error',
  '//localhost',
  '/\\',
] as const;

/**
 * Validate redirect URL to prevent open redirect vulnerabilities
 * 
 * Security: Only allows relative paths or same-origin URLs
 * 
 * @param redirectTo - User-provided redirect URL
 * @param appUrl - Application base URL
 * @param logger - Optional logger for security events
 * @returns Safe redirect URL or '/' fallback
 */
export function validateRedirectUrl(
  redirectTo: string,
  appUrl: string,
  logger?: { warn: (msg: string, ctx?: unknown) => void }
): string {
  // Empty or missing redirect defaults to home
  if (!redirectTo || redirectTo.trim() === '') {
    return '/';
  }

  // Check for protocol-relative URLs (e.g., //evil.com)
  if (redirectTo.startsWith('//')) {
    logger?.warn('Blocked protocol-relative redirect', { redirectTo });
    return '/';
  }

  // Check for backslash abuse (Windows-style paths)
  if (redirectTo.includes('\\')) {
    logger?.warn('Blocked backslash in redirect', { redirectTo });
    return '/';
  }

  // Allow relative paths starting with / (but not //)
  if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    // Check against blocked paths
    const isBlocked = BLOCKED_REDIRECT_PATHS.some((blocked) =>
      redirectTo.toLowerCase().startsWith(blocked.toLowerCase())
    );

    if (isBlocked) {
      logger?.warn('Blocked sensitive path redirect', { redirectTo });
      return '/';
    }

    // Check against allowed prefixes
    const isAllowed = ALLOWED_REDIRECT_PREFIXES.some((allowed) =>
      redirectTo.startsWith(allowed)
    );

    if (!isAllowed) {
      logger?.warn('Redirect path not in allowlist', { redirectTo });
      return '/';
    }

    return redirectTo;
  }

  // Handle absolute URLs - must be same origin
  try {
    const targetUrl = new URL(redirectTo);
    const appUrlObj = new URL(appUrl);

    if (targetUrl.origin === appUrlObj.origin) {
      // Same origin - validate path
      return validateRedirectUrl(targetUrl.pathname + targetUrl.search + targetUrl.hash, appUrl, logger);
    }

    logger?.warn('Blocked cross-origin redirect', { redirectTo, targetOrigin: targetUrl.origin });
    return '/';
  } catch {
    // Invalid URL format
    logger?.warn('Blocked malformed redirect URL', { redirectTo });
    return '/';
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Detect if request is a top-level browser navigation
 */
export function isNavigationRequest(req: NextRequest): boolean {
  // Check Fetch Metadata headers (Sec-Fetch-*)
  const secFetchMode = req.headers.get('sec-fetch-mode');
  const secFetchUser = req.headers.get('sec-fetch-user');
  const secFetchDest = req.headers.get('sec-fetch-dest');

  if (
    secFetchMode === 'navigate' ||
    secFetchUser === '?1' ||
    secFetchDest === 'document'
  ) {
    return true;
  }

  // Fallback for browsers without Sec-Fetch-* support (older Safari)
  const accept = req.headers.get('accept') || '';
  return accept.includes('text/html');
}

/**
 * Validated authorization request parameters
 */
export interface ValidatedAuthRequest {
  redirectTo: string;
  usePopup: boolean;
  direct: boolean;
  isNavigation: boolean;
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
}

/**
 * Validate and parse authorization request parameters
 */
export function validateAuthRequest(
  req: NextRequest,
  appUrl: string,
  logger?: { warn: (msg: string, ctx?: unknown) => void }
): ValidatedAuthRequest {
  const url = new URL(req.url);

  const rawRedirect = url.searchParams.get('redirectTo') || '/';
  const redirectTo = validateRedirectUrl(rawRedirect, appUrl, logger);

  const popup = url.searchParams.get('popup');
  const usePopup = popup === '1' || popup === 'true';

  const direct = url.searchParams.get('direct') === '1';
  const isNavigation = isNavigationRequest(req);

  const promptParam = url.searchParams.get('prompt');
  const prompt =
    promptParam === 'login' ||
    promptParam === 'consent' ||
    promptParam === 'select_account' ||
    promptParam === 'none'
      ? promptParam
      : undefined;

  return {
    redirectTo,
    usePopup,
    direct,
    isNavigation,
    prompt,
  };
}
