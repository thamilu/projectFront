// ============================================================
// features/auth/utils/sanitize-callback-url.ts
// Shared post-auth redirect validation for every Keycloak entry
// point (login gateway, register gateway, LoginButton, …).
// ============================================================

export const DEFAULT_CALLBACK_URL = '/';

/**
 * Validates and normalizes a user-supplied post-auth destination.
 *
 * This value ends up in `router.replace()` / `signIn({ callbackUrl })`
 * calls, so it must be constrained to a same-origin relative path before
 * it ever reaches either call site — this is the single source of truth
 * for that rule; do not re-implement it per call site.
 */
export function sanitizeCallbackUrl(rawUrl: string | null | undefined): string {
  const url = rawUrl?.trim();
  if (!url) return DEFAULT_CALLBACK_URL;

  // Only same-origin relative paths are allowed as redirect targets.
  if (!url.startsWith('/') || url.startsWith('//')) {
    return DEFAULT_CALLBACK_URL;
  }

  // Block pseudo-schemes / traversal tricks smuggled behind a leading slash.
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('javascript:') || lowerUrl.includes('data:') || url.includes('\\')) {
    return DEFAULT_CALLBACK_URL;
  }

  // Never redirect back into an auth gateway itself (infinite-loop guard).
  if (url.startsWith('/login') || url.startsWith('/register') || url.includes('error=SessionExpired')) {
    return DEFAULT_CALLBACK_URL;
  }

  return url;
}
