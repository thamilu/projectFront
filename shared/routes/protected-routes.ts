/**
 * protected-routes.ts
 *
 * Centralized list of routes requiring user authorization.
 *
 * Every entry must be a real, resolved URL prefix — not a source folder
 * name. Customer pages live under the app/(customer) route GROUP, which
 * (like all Next.js route groups) adds no path segment: there is no real
 * route in this app that resolves to a literal `/customer/*` URL. The
 * customer-only prefixes below were derived directly from
 * app/(customer)/**\/page.tsx's real top-level segments — verify against
 * that directory (not the folder name) before adding new entries here.
 */

export const PROTECTED_ROUTE_PREFIXES = [
  '/seller',
  '/delivery',
  '/admin',
  '/account',
  '/cart',
  '/checkout',
  '/orders',
  '/wishlist',
  '/dashboard',
  '/settings',
  '/notifications',
] as const;

export type ProtectedRoutePrefix = (typeof PROTECTED_ROUTE_PREFIXES)[number];
