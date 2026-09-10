/**
 * NextAuth route handler (App Router catch-all).
 *
 * This wrapper is a last-resort safety net, not the primary auth-error
 * path: NextAuth's own internal handler already catches "expected" OAuth/
 * config errors and redirects to pages.error ('/login', see @/auth) —
 * that's what powers the /login page's error=<code> UI. What reaches the
 * catch block below is something NextAuth itself didn't anticipate (e.g.
 * a bug in a custom jwt/session callback throwing synchronously), so this
 * only needs to degrade gracefully, not re-implement NextAuth's own error
 * taxonomy.
 */

import { handlers as realHandlers, AuthErrorCode } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestLogger } from '@/core/telemetry/logger';

type NextAuthHandlerMap = { GET: typeof realHandlers.GET; POST: typeof realHandlers.POST };

const isProd = process.env.NODE_ENV === 'production';

/**
 * True for routes the browser navigates to directly as part of the OAuth
 * redirect dance (Keycloak → /api/auth/callback/keycloak is a full page
 * load, not a fetch()) — those must fail into the app's existing error UI,
 * not a raw JSON body rendered as plain text with no way back into the app.
 *
 * Gated on method first, not just pathname: next-auth/react's client-side
 * signIn()/signOut() helpers both POST to /signin/:provider and /signout
 * respectively via fetch() and parse the response as JSON (confirmed by
 * reading node_modules/next-auth/react.js directly) — despite the
 * "/signin/" name, that path is NOT a raw browser navigation in this app's
 * actual usage (app/(auth)/login/page.tsx calls signIn() from
 * next-auth/react, never a plain <form>/<a> to that URL). Only the OAuth
 * *callback* — Keycloak's own server-issued redirect landing on
 * /api/auth/callback/:provider — is a genuine GET navigation. A POST
 * request here returning an HTML redirect instead of JSON would make
 * res.json() throw inside NextAuth's own client code, surfacing as an
 * unhandled rejection from signIn()/signOut() rather than a clean error.
 */
function isBrowserNavigationRoute(pathname: string, method: 'GET' | 'POST'): boolean {
  if (method !== 'GET') return false; // signin, signout, session, csrf all use POST/fetch
  return pathname.includes('/callback/') || pathname.includes('/signin/');
}

/**
 * @param method - HTTP method this instance handles.
 * @param handlerMap - Injectable so the catch/format logic here can be unit
 * tested with a stub that throws, without going through real NextAuth
 * internals. Defaults to the real handlers for production use.
 */
export const handleAuth = (method: 'GET' | 'POST', handlerMap: NextAuthHandlerMap = realHandlers) => {
  return async (req: NextRequest, _context: unknown) => {
    try {
      const handler = handlerMap[method];
      return await handler(req);
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : String(error);

      // Generated once, then used both in the log entry and the client
      // response — that pairing is what lets "a user reported an error at
      // 3:47pm" be traced to an exact log line instead of guessed at by
      // timestamp/path alone.
      const requestId = crypto.randomUUID();
      const log = getRequestLogger(requestId, { route: `[...nextauth]/${method}` });

      log.error(`[AuthRoute] Unhandled server error in NextAuth ${method} route`, {
        error: rawMessage,
        stack: error instanceof Error ? error.stack : undefined,
        path: req.nextUrl.pathname,
      });

      if (isBrowserNavigationRoute(req.nextUrl.pathname, method)) {
        // The browser is mid full-page-navigation here (e.g. returning from
        // Keycloak) — a JSON body would render as an unstyled blob with no
        // way back into the app. Route into the same error UI the rest of
        // the auth flow already uses (see app/(auth)/login/page.tsx).
        const errorUrl = new URL('/login', req.nextUrl.origin);
        errorUrl.searchParams.set('error', AuthErrorCode.INTERNAL_SERVER_ERROR);
        errorUrl.searchParams.set('requestId', requestId);
        return NextResponse.redirect(errorUrl, {
          status: 302,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
      }

      // Non-navigation routes (signin, signout, session, csrf, providers)
      // are consumed by NextAuth's own client-side fetch() calls, which
      // expect JSON.
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 500,
          error: 'Internal Server Error',
          errorCode: AuthErrorCode.INTERNAL_SERVER_ERROR,
          // Raw exception text never reaches the client in production —
          // it can plausibly contain provider config, adapter/DB error
          // strings, or internal paths (OWASP A05:2021). The full detail
          // is already captured above via log.error() regardless of env.
          message: isProd
            ? 'An unexpected authentication error occurred. Please try again.'
            : rawMessage,
          path: req.nextUrl.pathname,
          requestId,
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }
  };
};

export const GET = handleAuth('GET');
export const POST = handleAuth('POST');
