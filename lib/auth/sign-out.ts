import type { NextAuthConfig } from 'next-auth';
import { env } from '@/env';
import { logger } from '@/core/telemetry/logger';
import { asExtendedJWT } from './utils';

// ─── Security Guard ────────────────────────────────────────────────────────────
// This file directly references env.KEYCLOAK_CLIENT_SECRET. Same independent,
// per-file runtime backstop as token-refresh.ts — see that file's guard
// comment for why 'server-only' isn't used here.
if (typeof window !== 'undefined') {
  throw new Error(
    '[SECURITY] Sign-out module must only run on the server. ' +
      'Do not import lib/auth/sign-out in client components.'
  );
}

const KEYCLOAK_LOGOUT_TIMEOUT_MS = 5000;
const KEYCLOAK_LOGOUT_MAX_RETRIES = 1; // Off the critical path (fire-and-forget) — one retry is cheap insurance

// Derived from NextAuthConfig itself (not hand-declared) so this stays in
// sync if the library's event payload shape ever changes — a hand-rolled
// parallel type could silently drift instead of failing to compile.
type SignOutEvent = NonNullable<NonNullable<NextAuthConfig['events']>['signOut']>;
type SignOutMessage = Parameters<SignOutEvent>[0];

/**
 * Performs Keycloak back-channel single logout (revocation).
 * Enforces a 5-second timeout via AbortController.
 * Failure is non-fatal — user session is cleared regardless.
 */
export async function handleKeycloakSignOut(message: SignOutMessage): Promise<void> {
  // Guard: only JWT-based sessions carry idToken
  if (!message || !('token' in message) || !message.token) return;

  const extToken = asExtendedJWT(message.token);

  // Guard: idToken required for back-channel logout
  if (!extToken.idToken) {
    logger.debug('[Auth] Sign-out skipped — no idToken present');
    return;
  }

  const idToken = extToken.idToken;
  const runLogout = () =>
    performKeycloakLogout(idToken).catch((err) => {
      logger.error('[Auth] Keycloak back-channel logout background task failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    });

  try {
    // Dynamic import is deliberate, not stylistic: this module is reachable
    // (via events.signOut -> lib/auth/index.ts -> @/auth) from a dynamic
    // import chain that Next.js's bundler still statically traces for
    // client-bundle purposes (core/interceptors/index.ts's server-only
    // branch dynamically imports @/core/auth/server-session, which
    // dynamically imports @/auth). A static `import { after } from
    // 'next/server'` at the top of this file made that trace fail the
    // build outright ("needs 'after' ... only works in a Server
    // Component"), even though this code path never executes client-side —
    // the runtime `typeof window` guard above was never reached, because
    // Turbopack rejects the import at build time, before any runtime check
    // gets a chance to run. Matches the same dynamic-import pattern
    // server-session.ts already uses for next/headers in this exact chain.
    const { after } = await import('next/server');
    // Extends this request's lifetime on platforms that would otherwise
    // freeze/tear down the execution environment as soon as the response is
    // sent (Vercel Functions, other serverless runtimes) — without this, a
    // bare detached promise can be silently killed mid-flight before the
    // Keycloak logout call completes, with no error ever logged (the
    // process stops, it doesn't throw), leaving the Keycloak SSO session
    // alive despite the app considering sign-out complete.
    after(runLogout);
  } catch (err) {
    // after() throws if called outside a Next.js request scope. Falls back
    // to the original detached-promise behavior — this cleanup call is
    // explicitly non-fatal either way, so a missing request scope must
    // never block or throw out of sign-out itself.
    logger.debug('[Auth] after() unavailable for back-channel logout — using detached promise', {
      error: err instanceof Error ? err.message : String(err),
    });
    void runLogout();
  }
}

async function attemptKeycloakLogout(
  logoutUrl: string,
  idToken: string
): Promise<{ ok: true } | { ok: false; retryable: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KEYCLOAK_LOGOUT_TIMEOUT_MS);

  try {
    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.KEYCLOAK_CLIENT_ID,
        client_secret: env.KEYCLOAK_CLIENT_SECRET,
        id_token_hint: idToken,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn('[Auth] Keycloak back-channel logout returned non-OK status', {
        status: response.status,
        statusText: response.statusText,
      });
      // Only 5xx is worth a retry — a 4xx (e.g. already-invalid id_token)
      // will fail identically on a second attempt.
      return { ok: false, retryable: response.status >= 500 };
    }

    logger.info('[Auth] Keycloak session successfully terminated on sign out');
    return { ok: true };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    logger.error('[Auth] Keycloak back-channel logout failed', {
      error: err instanceof Error ? err.message : String(err),
      timedOut: isAbort,
    });
    return { ok: false, retryable: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function performKeycloakLogout(idToken: string): Promise<void> {
  const logoutUrl = `${env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;

  for (let attempt = 0; attempt <= KEYCLOAK_LOGOUT_MAX_RETRIES; attempt++) {
    const result = await attemptKeycloakLogout(logoutUrl, idToken);
    if (result.ok || !result.retryable || attempt === KEYCLOAK_LOGOUT_MAX_RETRIES) return;

    logger.info('[Auth] Retrying Keycloak back-channel logout', { attempt: attempt + 1 });
  }
}
