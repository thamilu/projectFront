/**
 * Auth barrel re-export.
 *
 * `@/auth` is the permanent, canonical public entry point for the NextAuth
 * config — not a temporary migration shim. The NextAuth configuration has
 * been decomposed into focused modules under `lib/auth/` for maintainability,
 * but those modules are an internal implementation detail: nothing outside
 * this barrel should import `@/lib/auth/*` directly (enforced by the
 * no-restricted-imports pattern in eslint.config.js). Keeping every consumer
 * on one stable import path means lib/auth/'s internal structure can keep
 * changing without ever being a breaking change for the rest of the app.
 *
 * Exceptions: lib/auth/constants.ts (NEXT_AUTH_ERROR_MESSAGES,
 * DEFAULT_AUTH_ERROR_MESSAGE, NextAuthErrorCode) and lib/auth/types.ts
 * (AuthErrorCode and friends) are deliberately NOT required to route through
 * here — see the no-restricted-imports pattern in eslint.config.js. Both
 * have zero next-auth/jose runtime dependencies, but this barrel's very
 * first export line pulls in the real NextAuth() initialization from
 * lib/auth/index.ts, which (a) ships pure ESM Jest's default transform
 * cannot parse — routing the login page's error-message catalog through
 * @/auth previously broke every test that transitively imported it (5
 * suites) — and (b) throws at runtime in any browser context (see the
 * server guard in lib/auth/index.ts), which matters specifically for
 * AuthErrorCode: it's a real value (not just a type) that client components
 * legitimately need for comparisons (e.g. `session.error ===
 * AuthErrorCode.REFRESH_TOKEN_ERROR`). This barrel still re-exports
 * AuthErrorCode below for server-side convenience, but any 'use client'
 * file MUST import it from '@/lib/auth/types' directly instead — importing
 * it from here in client code will crash in the browser.
 *
 * @see lib/auth/index.ts    — NextAuth config, callbacks, events
 * @see lib/auth/types.ts    — Type contracts, module augmentations — import directly from client code, see exception above
 * @see lib/auth/config.ts   — Configuration constants
 * @see lib/auth/utils.ts    — Utility functions
 * @see lib/auth/token-refresh.ts — Token refresh with retry + lock
 * @see lib/auth/backend-role.ts  — Backend role fetching
 * @see lib/auth/constants.ts     — User-facing error message catalog (/login page) — import directly, see exception above
 */
import { cache } from 'react';
import { handlers, signIn, signOut, auth as authUncached } from '@/lib/auth';

export { handlers, signIn, signOut };
export { AuthErrorCode } from '@/lib/auth/types';
export type { ExtendedJWT } from '@/lib/auth/types';

/**
 * React `cache()`-memoized per-request. Neither next-auth 5.0.0-beta.31 nor
 * this app's own lib/auth/ wrapper deduplicates auth() internally (verified
 * directly against the installed package — no `cache(` call anywhere in its
 * core files), so any Server Component route calling auth() more than once
 * per request (e.g. both generateMetadata() and the page body, a real,
 * common pattern in this app) would otherwise re-validate the session's JWT
 * signature from scratch on every call. cache() scopes the memoization to a
 * single request's render pass — it does not persist across requests or
 * users, so this cannot leak one user's session into another's response.
 */
export const auth = cache(authUncached);
