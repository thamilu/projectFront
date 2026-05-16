import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/env'

// Initialize Upstash Redis & Ratelimit only if credentials are provided and not placeholders
const isUpstashConfigured = 
  env.UPSTASH_REDIS_REST_URL && 
  !env.UPSTASH_REDIS_REST_URL.includes('placeholder') &&
  env.UPSTASH_REDIS_REST_TOKEN && 
  env.UPSTASH_REDIS_REST_TOKEN !== 'placeholder-token';

const ratelimit = isUpstashConfigured 
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      // @ts-expect-error - slidingWindow is a static method but sometimes typed incorrectly in ESM
      limiter: Ratelimit.slidingWindow(100, '60 s'),
    })
  : null;

const STATIC_PREFIXES = [
  '/_next/',
  '/images/',
  '/fonts/',
  '/icon-',
  '/favicon',
  '/manifest',
  '/.well-known/',
]

const STATIC_FILE_REGEX = /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|json|webmanifest)$/i

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Skip static assets
  if (STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix)) || STATIC_FILE_REGEX.test(pathname)) {
    return NextResponse.next()
  }

  // 2. Rate Limiting (Edge-side)
  if (ratelimit) {
    const ip = (req as any).ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1'
    try {
      const { success, limit, remaining } = await ratelimit.limit(ip)
      if (!success) {
        return NextResponse.json(
          { code: 'RATE_LIMITED', message: 'Too many requests' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
            }
          }
        )
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fallback: allow request if rate limiter fails
    }
  }

  // 3. Auth Check
  const session = await auth()
  const isAuth = !!session

  // 4. RBAC & Route Guards
  const protectedRoutes = ['/seller', '/customer', '/delivery']
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))

  if (isProtected && !isAuth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Propagate Headers & Correlation ID
  const correlationId = crypto.randomUUID()
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('X-Correlation-ID', correlationId)
  
  if (session?.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 6. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  return response
}

export const config = {
  matcher: ['/(.*)'],
}
