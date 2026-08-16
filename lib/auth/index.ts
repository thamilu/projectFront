// ─── ESM Type Augmentation Side-Effects ──────────────────────────────────────
/**
 * Side-effect import required for NextAuth module augmentation.
 * TypeScript erases 'import type' at compile time, so this bare import
 * ensures the 'declare module' in types.ts runs and extends NextAuth types.
 * See: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 */
import './types';

// ─── Security Guard ───────────────────────────────────────────────────────────
// NOTE: 'server-only' handles build time. This guard catches edge cases
// like jest environments or non-standard bundlers.
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
import { asExtendedJWT } from './utils';
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
        const extToken = asExtendedJWT(token);

        if (trigger === 'update') {
          return await handleUpdateTrigger(extToken);
        }

        if (account) {
          return await handleInitialSignIn(account, token);
        }

        return await handleTokenRefreshIfNeeded(extToken);
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
  // trustHost: true is only trusted conditionally (by default in dev/test,
  // or explicitly via AUTH_TRUST_HOST environment variable in production).
  trustHost: process.env.AUTH_TRUST_HOST === 'true' || env.NODE_ENV === 'development',
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
