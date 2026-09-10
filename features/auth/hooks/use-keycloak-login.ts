'use client';

import { useSearchParams } from 'next/navigation';
import { sanitizeCallbackUrl } from '@/domains/auth/utils/sanitize-callback-url';

/**
 * Accepts '1' or 'true' from either source. Only the URL param
 * (?force_login=1) is actually written by any code today — nothing in
 * this app currently sets the sessionStorage key — but both are checked
 * the same way so a future "switch account" flow can write either
 * representation without silently being ignored here.
 */
function isTruthyFlag(value: string | null): boolean {
  return value === '1' || value === 'true';
}

/**
 * sessionStorage.getItem can throw in restrictive browser contexts (some
 * private-browsing modes, storage-partitioned iframes). This must never
 * crash the login page over a non-essential, defensive-only read.
 */
function readSessionStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Custom hook to derive Keycloak login settings, callback URLs,
 * and loop prevention states from search parameters and storage.
 *
 * Pure state derivation only — this hook does not itself call signIn() or
 * decide whether to redirect. See useAuthRedirect.ts's effect, which
 * gates every auto-redirect on `if (isAuthError || sessionExpired ||
 * hasRedirected.current) return;` before ever calling signIn(). The
 * fields below are meaningless as loop-prevention on their own; they only
 * work because that specific guard reads them.
 */
export function useKeycloakLogin() {
  const params = useSearchParams();

  const callbackUrl = sanitizeCallbackUrl(params?.get('callbackUrl') || params?.get('from'));

  const forceLogin =
    isTruthyFlag(params?.get('force_login') ?? null) || isTruthyFlag(readSessionStorage('force_login'));

  const errorCode = params?.get('error') ?? null;

  /**
   * Deliberately broad, not an allowlist of known NextAuth error codes:
   * ANY non-null `error` param stops the auto-redirect (see
   * useAuthRedirect.ts) and shows a manual retry button instead. This is
   * the fail-SAFE direction — an allowlist would fail unsafe instead: a
   * NextAuth/Keycloak error code this app's allowlist doesn't yet know
   * about (a new NextAuth version, an unmapped Keycloak response) would
   * fall outside it, isAuthError would be false, and the page would
   * resume auto-redirecting into the same failure — exactly the infinite
   * loop this flag exists to prevent. The cost of being broad is a
   * generic "Authentication Error" message (see useErrorMessage, which
   * already maps unrecognized codes to a safe default rather than ever
   * rendering the raw query value) for a hand-crafted/unrecognized error=
   * value; the cost of an allowlist being incomplete is a redirect loop.
   */
  const isAuthError = errorCode !== null;

  /**
   * Session-expiry is a UI-message selector (which alert text shows),
   * never a privilege or access-control signal — a user manually crafting
   * ?session_expired=true only changes which harmless message they see on
   * their own screen, same as isAuthError above already treats URL state
   * as a hint rather than an authority.
   */
  const sessionExpired = params?.get('session_expired') === 'true' || errorCode === 'SessionExpired';

  return {
    callbackUrl,
    forceLogin,
    isAuthError,
    sessionExpired,
    errorCode,
  };
}
