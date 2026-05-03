/**
 * Home Page Public API (minimal)
 *
 * NOTE: Barrel exports that mix Server and Client Components can cause
 * bundling issues with the Next.js App Router (Turbopack/webpack). To
 * avoid accidental client-side inclusion of server code, this file
 * intentionally exposes only the page component. Import section
 * components directly from their files or use the explicit
 * `index.server.ts` / `index.client.ts` barrels when necessary.
 *
 * Usage examples:
 * ```ts
 * // Public (page) import
 * import { HomePage } from '@/components/home';
 *
 * // Server-only sections
 * import { FeaturedProductsSection } from '@/components/home/index.server';
 *
 * // Client-only skeletons/errors
 * import { FlashDealsSkeleton } from '@/components/home/index.client';
 * ```
 */

import 'server-only';

export { default as HomePage } from './HomePage';

/** @internal Barrel metadata for validation scripts */
export const __BARREL_META__ = {
	type: 'public',
	companions: ['./index.server', './index.client'],
	exports: ['HomePage'],
} as const;
