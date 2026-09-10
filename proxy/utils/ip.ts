import type { NextRequest } from 'next/server';
import { env } from '@/env';

/**
 * Extracts the trusted client IP.
 * Uses req.ip populated by Vercel edge runtime.
 * Falls back to 127.0.0.1 in development or test environments to support local testing.
 */
export function getTrustedIp(req: NextRequest): string {
  const reqIp = (req as { ip?: string }).ip;
  if (reqIp) return reqIp;

  // Standard proxy header checking.
  //
  // Trust the LAST entry, not the first. Production runs behind nginx (see
  // .env.example's NEXT_PUBLIC_WS_URL comment and the X-Accel-Buffering
  // header in app/api/orders/[id]/stream/route.ts) — req.ip above is a
  // Vercel-only edge-runtime property, so in the real deployment this
  // header is the actual trusted-IP source on every request, not a rare
  // fallback. In a standard single-reverse-proxy X-Forwarded-For chain the
  // proxy APPENDS the real client IP to whatever was already present, so
  // the first entry is exactly what an attacker can set themselves via a
  // spoofed request header, while the last entry is nginx's own addition.
  // Taking ips[0] here previously let a client defeat the rate limiter by
  // sending a different X-Forwarded-For value on every request.
  // This assumes nginx.conf appends (not overwrites) X-Forwarded-For via
  // the common `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
  // directive — confirm that's the case (or that no additional untrusted
  // hop sits in front of nginx) in eshop_back's nginx.conf.
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',');
    return ips[ips.length - 1].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Local development or local production runs (e.g. running 'next start' locally)
  const host = req.headers.get('host') || '';
  if (
    env.NODE_ENV === 'development' ||
    env.NODE_ENV === 'test' ||
    host.includes('localhost') ||
    host.includes('127.0.0.1')
  ) {
    return '127.0.0.1';
  }

  return 'unknown';
}
