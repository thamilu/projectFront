import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { STATIC_SECURITY_HEADERS, buildCsp } from '@/shared/config/security-headers';
import { getRatelimitForPath } from '@/proxy/utils/ratelimit';
import { applyRateLimit } from '@/proxy/handlers/rate-limit';
import { applyAuthGuard } from '@/proxy/handlers/auth-guard';
import { applyRbac } from '@/proxy/handlers/rbac';
import { generateCorrelationId } from '@/shared/utils/generate-id';
import { generateNonce } from '@/shared/utils/generate-nonce';
import type { AuthenticatedRequest } from '@/proxy/types/proxy.types';
import { API_ROUTE_PREFIXES } from '@/shared/routes';

// ─── Proxy Orchestrator ───────────────────────────────────────────────────────

export default auth(async function proxy(req: AuthenticatedRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Rate Limiting — per-route limits (auth routes stricter) ────────────
  const ratelimitData = getRatelimitForPath(pathname);
  if (ratelimitData) {
    const { limiter, identifierType } = ratelimitData;
    const rateLimitResponse = await applyRateLimit(req, limiter, pathname, identifierType);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // ── 2. Auth Guard — redirect unauthenticated users to login ───────────────
  const session = req.auth;
  const isAuth = session !== null;

  const authResponse = applyAuthGuard(pathname, isAuth, req);
  if (authResponse) return authResponse;

  // ── 3. RBAC — enforce role-based access for all protected routes ──────────
  const rbacResponse = applyRbac(pathname, session, req);
  if (rbacResponse) return rbacResponse;

  // ── 4. Request Enrichment ─────────────────────────────────────────────────
  const correlationId = generateCorrelationId();
  const nonce = generateNonce();

  // Computed once and set on both the request and the response: Next.js's
  // own internal script-nonce detection (getScriptNonceFromHeader, used to
  // nonce Next's own streaming/hydration inline scripts) reads
  // `content-security-policy` off the INCOMING request, not the outgoing
  // response — setting it only on the response (as this used to) leaves
  // Next's own inline scripts un-nonced under the strict, no-unsafe-inline
  // production policy below.
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('X-Correlation-ID', correlationId);
  requestHeaders.set('X-Nonce', nonce);
  requestHeaders.set('x-csp-nonce', nonce); // Compatible with layout's getCSPNonce()
  requestHeaders.set('Content-Security-Policy', csp);

  // Forward access token ONLY to API routes — never to page navigations or auth routes
  const isApiRoute = API_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = pathname.startsWith('/api/auth');
  if (isAuth && isApiRoute && !isAuthRoute) {
    const { getToken } = await import('next-auth/jwt');
    const rawToken = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });
    if (rawToken?.accessToken) {
      requestHeaders.set('Authorization', `Bearer ${rawToken.accessToken}`);
    }
  }

  // ── 5. Build Response with Security Headers ───────────────────────────────
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Correlation ID on response — visible in client DevTools for support traces
  response.headers.set('X-Correlation-ID', correlationId);

  // Static security headers
  for (const [key, value] of STATIC_SECURITY_HEADERS) {
    response.headers.set(key, value);
  }

  // Dynamic CSP — per-request nonce prevents inline script injection
  response.headers.set('Content-Security-Policy', csp);

  return response;
});

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (Next.js static assets)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (public metadata)
     * - /images/, /fonts/ (public static assets)
     *
     * This excludes static files at the matcher level (more efficient than
     * checking inside the proxy function body).
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|images/|fonts/).*)',
  ],
};
