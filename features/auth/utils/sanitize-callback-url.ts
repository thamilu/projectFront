// ============================================================
// features/auth/utils/sanitize-callback-url.ts
// Shared post-auth redirect validation for every Keycloak entry
// point (login gateway, register gateway, LoginButton, …).
// ============================================================

import { logger } from '@/core/telemetry/logger';

export const DEFAULT_CALLBACK_URL = '/';

/**
 * Validates and normalizes a user-supplied post-auth destination.
 *
 * This value ends up in `router.replace()` / `signIn({ callbackUrl })`
 * calls, so it must be constrained to a same-origin relative path before
 * it ever reaches either call site — this is the single source of truth
 * for that rule; do not re-implement it per call site.
 *
 * Rejections are always logged at warn level, in every environment —
 * this is exactly the security-relevant telemetry (blocked open-redirect
 * attempts) production monitoring needs to see, so it must never be
 * suppressed behind a NODE_ENV check the way ad-hoc per-component
 * validators have sometimes done.
 *
 * @param rawUrl - Untrusted, user-influenced destination (query param, prop, etc.)
 * @param defaultUrl - Fallback when rawUrl is missing or rejected. @default '/'
 */
export function sanitizeCallbackUrl(
  rawUrl: string | null | undefined,
  defaultUrl: string = DEFAULT_CALLBACK_URL
): string {
  const url = rawUrl?.trim();
  if (!url) return defaultUrl;

  const reject = (reason: string): string => {
    logger.warn('[sanitizeCallbackUrl] Rejected unsafe redirect target', { url, reason });
    return defaultUrl;
  };

  // Only same-origin relative paths are allowed as redirect targets.
  if (!url.startsWith('/') || url.startsWith('//')) {
    return reject('not a same-origin relative path');
  }

  // Block pseudo-schemes / traversal tricks smuggled behind a leading slash,
  // including backslash variants some URL parsers normalize to `//`.
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('javascript:') || lowerUrl.includes('data:') || url.includes('\\')) {
    return reject('dangerous scheme or backslash');
  }

  // Never redirect back into an auth gateway itself (infinite-loop guard).
  if (url.startsWith('/login') || url.startsWith('/register') || url.includes('error=SessionExpired')) {
    return reject('targets an auth gateway route');
  }

  return url;
}
