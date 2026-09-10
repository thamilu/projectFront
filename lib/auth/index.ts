// ─── ESM Type Augmentation Side-Effects ──────────────────────────────────────
/**
 * Side-effect import required for NextAuth module augmentation.
 * TypeScript erases 'import type' at compile time, so this bare import
 * ensures the 'declare module' in types.ts runs and extends NextAuth types.
 * See: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 */
import './types';

// ─── Security Guard ───────────────────────────────────────────────────────────
// Runtime check: this is the ONLY guard currently in place. There is no
// 'server-only' package import backing this up at build time — it is not
// an installed dependency of this project. If it's added later, import it
// above (before any other import) for an earlier, compile-time failure;
// until then, this runtime throw is what actually protects this module.
// This must appear before any logic, but after imports (ESM hoisting rule).
if (typeof window !== 'undefined') {
  throw new Error(
    '[SECURITY] NextAuth config must only run on the server. ' +
      'Do not import this module in client components.'
  );
}

// ─── Imports ─────────────────────────────────────────────────────────────────
import NextAuth, { type Session } from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import { env } from '@/env';
import { logger } from '@/core/telemetry/logger';
import { asExtendedJWT, createErrorToken } from './utils';
import { AuthErrorCode } from './types';
import { handleKeycloakSignOut } from './sign-out';
import {
  handleInitialSignIn,
  handleUpdateTrigger,
  handleTokenRefreshIfNeeded,
  resolveSessionIdentity,
  buildSessionUser,
} from './handlers';

// ─── NextAuth Configuration ──────────────────────────────────────────────────

const nextAuth = NextAuth({
  providers: [
    Keycloak({
      clientId: env.KEYCLOAK_CLIENT_ID,
      clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      issuer: env.KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account, trigger }) {
      const startTime = performance.now();
      const path = trigger === 'update' ? 'update' : account ? 'initial-signin' : 'refresh';

      try {
        // asExtendedJWT is intentionally NOT called here for the initial
        // sign-in path below: the bare pre-Keycloak token NextAuth passes in
        // on first sign-in legitimately doesn't have accessToken/expiresAt/
        // roles yet, so validating it against ExtendedJWT's shape would
        // trip on every single sign-in — not a real error. Each branch below
        // validates only the token shape it actually expects.
        if (trigger === 'update') {
          return await handleUpdateTrigger(asExtendedJWT(token));
        }

        if (account) {
          return await handleInitialSignIn(account, token);
        }

        return await handleTokenRefreshIfNeeded(asExtendedJWT(token));
      } catch (err) {
        // The handlers above already catch their own expected failure modes
        // and return a degraded-but-valid ExtendedJWT. This only fires for
        // truly unexpected throws (e.g. a bug in asExtendedJWT) — without it,
        // the exception propagates uncaught out of NextAuth entirely, which
        // crashes any Server Component/Action that calls auth() directly
        // (outside the /api/auth/[...nextauth] route's own error boundary).
        logger.error('[Auth] JWT callback threw unexpectedly', {
          path,
          error: err instanceof Error ? err.message : String(err),
        });
        return createErrorToken(AuthErrorCode.CALLBACK_ERROR);
      } finally {
        const duration = Math.round(performance.now() - startTime);
        logger.debug('[Auth] JWT callback completed', { path, durationMs: duration });
      }
    },

    async session({ session, token }): Promise<Session> {
      const extToken = asExtendedJWT(token);
      const { sessionError, userIdVal } = resolveSessionIdentity(extToken);

      return {
        ...session,
        error: sessionError,
        roles: extToken.roles ?? [],
        backendRoleError: extToken.backendRoleError,
        expiresAt: extToken.expiresAt,
        user: buildSessionUser(session.user, extToken, userIdVal),
      } satisfies Session;
    },
  },
  events: {
    signOut: handleKeycloakSignOut,
  },
  pages: {
    signIn: '/login',
    // The login page already fully handles ?error=<code> (NEXT_AUTH_ERROR_MESSAGES,
    // retry button, focus management — see app/(auth)/login/page.tsx). Pointing the
    // error page at a separate /auth/error route left it 404ing, since no page was
    // ever built there; reusing /login avoids a second, duplicate error UI to maintain.
    error: '/login',
  },
  // Explicit session cookie policy rather than relying on NextAuth's undocumented
  // defaults. This governs the JWT session cookie's own lifetime/rotation — a
  // separate concern from the Keycloak access token's own (much shorter) expiry,
  // which is independently enforced by refreshAccessTokenWithLock. Configurable
  // per-environment since acceptable session length is a security-policy choice.
  session: {
    maxAge: env.AUTH_SESSION_MAX_AGE_SECONDS,
    updateAge: env.AUTH_SESSION_UPDATE_AGE_SECONDS,
  },
  // trustHost: true is only trusted conditionally (by default in dev/test,
  // or explicitly via AUTH_TRUST_HOST environment variable in production).
  trustHost: env.AUTH_TRUST_HOST === true || env.NODE_ENV === 'development',
});

// ─── Public APIs Exports with JSDocs ─────────────────────────────────────────

/**
 * NextAuth route handlers for App Router.
 * Mount at: app/api/auth/[...nextauth]/route.ts
 *
 * @example
 * export const { GET, POST } = handlers;
 */
export const handlers = nextAuth.handlers;

/**
 * Server-side sign-in function.
 * Call from Server Actions or API routes only.
 *
 * @example
 * await signIn('keycloak', { redirectTo: '/dashboard' });
 */
export const signIn = nextAuth.signIn;

/**
 * Server-side sign-out function.
 * Triggers Keycloak back-channel logout automatically via events.signOut.
 */
export const signOut = nextAuth.signOut;

/**
 * Server-side session accessor.
 * Returns full session including internal JWT (server-only).
 *
 * @example
 * const session = await auth();
 * const userId = session?.user?.id;
 */
export const auth = nextAuth.auth;
