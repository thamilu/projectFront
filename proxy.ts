/**
 * Next.js Proxy with NextAuth Protection (Next.js 16+)
 * 
 * Single source of truth for authentication and role-based routing.
 * Handles RBAC, CSP headers, redirects, and rate limiting.
 * Renamed from middleware.ts to proxy.ts per project conventions.
 */

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/observability/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { APP_ROUTES } from '@/constants/routes/app-routes';

// --- CONSTANTS DEFINED OUTSIDE REQUEST SCOPE FOR PERFORMANCE ---

// Prefixes that should immediately skip all middleware processing (Static assets, core auth APIs)
const STATIC_PREFIXES = [
  '/_next/',
  '/images/',
  '/fonts/',
  '/icon-',
  '/favicon',
  '/manifest',
  '/.well-known/',
  '/auth/',
  '/api/auth/',
];

// Regex for all static file extensions
const STATIC_FILE_REGEX = /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|json|webmanifest)$/i;

// Routes that any guest can visit without authentication
const PUBLIC_ROUTES = [
  APP_ROUTES.HOME,
  APP_ROUTES.PRODUCTS,
  APP_ROUTES.CATEGORIES,
  APP_ROUTES.ABOUT,
  APP_ROUTES.CONTACT,
  APP_ROUTES.HELP,
  APP_ROUTES.TERMS,
  APP_ROUTES.PRIVACY,
  APP_ROUTES.SEARCH,
];

/**
 * Generate a random CSP nonce for inline scripts/styles
 */
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  logger.debug('[proxy] Request received', { pathname });

  // CRITICAL: Skip proxy for static assets and public Auth API routes
  const isStaticPrefix = STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isStaticFile = STATIC_FILE_REGEX.test(pathname);

  if (
    pathname === APP_ROUTES.AUTH_LOGIN ||
    pathname === APP_ROUTES.AUTH_REGISTER ||
    isStaticPrefix ||
    isStaticFile
  ) {
    return NextResponse.next();
  }

  // Generate CSP nonce
  const nonce = generateNonce();
  const response = NextResponse.next();
  response.headers.set('x-csp-nonce', nonce);

  // Check if current route matches any public route (exact or sub-path)
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`) || pathname.startsWith(`${route}?`)
  );

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (isPublicRoute && !token) {
    return response;
  }

  if (!token) {
    logger.info('[proxy] Redirecting to login', { pathname });
    const loginUrl = new URL(APP_ROUTES.AUTH_LOGIN, req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rate Limiting (Applied to authenticated/protected traffic)
  // Using 'x-forwarded-for' or falling back to 'anon'.
  // In production, ensure your reverse proxy (Vercel/Cloudflare) standardizes this header.
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon';
    
    // STRICT limit for auth routes (login, register, session)
    // RELAXED limit for general API (dashboard data, products, etc)
    const isAuthApi = pathname.startsWith('/api/auth') || pathname.startsWith('/auth');
    const limitConfig = isAuthApi ? RATE_LIMITS.auth : RATE_LIMITS.authenticated;
    
    const rateLimitResult = checkRateLimit(ip, limitConfig);
    
    if (!rateLimitResult.allowed) {
        logger.warn('[proxy] Rate limit exceeded', { ip, pathname });
        return NextResponse.json(
            { message: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
            { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter || 60) } }
        );
    }
  } catch (error) {
    // Fail safe: If rate limiting throws, log it but don't block the request unless critical
    logger.error('[proxy] Rate limit error', { error });
  }

  // Role-based access control
  const rawRoles = (token as any).roles || [];
  const roles = Array.isArray(rawRoles) ? rawRoles.map(r => String(r).toUpperCase()) : [];
  const isSeller = roles.includes('SELLER');
  const isDeliveryAgent = roles.includes('DELIVERY_AGENT');

  if (pathname.startsWith(APP_ROUTES.SELLER.BASE) && !pathname.startsWith(APP_ROUTES.SELLER.REGISTER) && !isSeller) {
    return NextResponse.redirect(new URL(APP_ROUTES.SELLER.REGISTER, req.url));
  }

  if (pathname.startsWith(APP_ROUTES.DELIVERY.DASHBOARD) && !isDeliveryAgent) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // Allow sellers and delivery agents to view the consumer home page if they choose
  // if (pathname === '/') {
  //   if (isSeller) return NextResponse.redirect(new URL(APP_ROUTES.SELLER.DASHBOARD, req.url));
  //   if (isDeliveryAgent) return NextResponse.redirect(new URL(APP_ROUTES.DELIVERY.DASHBOARD, req.url));
  // }

  return response;
}

export const config = {
  matcher: [
    '/(.*)',
  ],
};
