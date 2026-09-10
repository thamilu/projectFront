/**
 * robots.txt
 *
 * Two fixes over the previous version:
 *
 * 1. **The base URL comes from validated env**, not a raw `process.env` read
 *    with a `'https://yourdomain.com'` fallback. That fallback meant a
 *    deployment missing `NEXT_PUBLIC_APP_URL` would publish a placeholder
 *    domain as its canonical sitemap location — precisely the failure mode env
 *    validation exists to prevent, bypassed by reading around it.
 *
 * 2. **The disallow list covers every authenticated area.** It previously
 *    listed `/account/orders/` but not `/account/`, and omitted `/settings/`,
 *    `/wishlist/`, `/orders/`, `/notifications/`, `/dashboard/`, `/delivery/`
 *    and `/admin/` entirely.
 *
 * Note that robots directives are advisory. The authenticated route groups also
 * emit `noindex` via their own layouts (see `app/(customer)/layout.tsx`), which
 * is the stronger control; this file is defence in depth and a crawl-budget
 * optimisation, not the primary protection.
 *
 * @module app/robots
 */

import type { MetadataRoute } from 'next';
import { env } from '@/env';

/**
 * Path prefixes no crawler should spend budget on.
 *
 * Derived from the same concerns as `PROTECTED_ROUTE_PREFIXES`, plus framework
 * and API internals. Kept as an explicit list rather than generated from that
 * constant because the two answer different questions — "requires a session"
 * and "should be crawled" overlap heavily but are not the same set.
 */
const DISALLOWED_PREFIXES: readonly string[] = [
  // Framework and API internals
  '/api/',
  '/_next/',

  // Authenticated customer areas
  '/account/',
  '/cart/',
  '/checkout/',
  '/orders/',
  '/wishlist/',
  '/settings/',
  '/notifications/',
  '/dashboard/',

  // Role consoles
  '/seller/',
  '/delivery/',
  '/admin/',

  // Auth flow — no content worth ranking, and the URLs carry callback params
  '/login',
  '/auth/',

  // Error routes, which would otherwise be indexed as thin content
  '/403',
  '/500',
  '/unauthorized',
  '/access-denied',
  '/offline',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...DISALLOWED_PREFIXES],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
