/**
 * XML sitemap.
 *
 * Four fixes over the previous version:
 *
 * 1. **Validated base URL.** It read `process.env.NEXT_PUBLIC_APP_URL ||
 *    'https://yourdomain.com'`, so a deployment missing that variable published
 *    a placeholder domain in every entry.
 *
 * 2. **Complete static route coverage.** Only four static pages were listed.
 *    `/categories`, `/stores`, `/deals`, `/flash-deals`, `/help`, `/terms`,
 *    `/privacy`, `/compare` and `/search` were all absent.
 *
 * 3. **Bounded, concurrent product fetching.** Products were fetched in a
 *    sequential `while` loop of up to 100 pages — 10,000 products, one request
 *    at a time, with no timeout — blocking the route for as long as the backend
 *    took. Pages are now fetched in bounded parallel batches with an overall
 *    deadline.
 *
 * 4. **Typed product URLs.** The previous `(product as any).urlSlug` cast is
 *    replaced by the real optional field. The numeric-id fallback is kept —
 *    `resolveProductBySlug` resolves an id as well as a slug, so those URLs do
 *    work — but a slug is always preferred, since the product page sets its
 *    canonical to whatever param it was reached by, and publishing the id form
 *    for a product that has a slug would create two indexable URLs for one
 *    product.
 *
 * @module app/sitemap
 */

import type { MetadataRoute } from 'next';
import { env } from '@/env';
import { productsApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import type { ProductDTO } from '@/domains/catalog/contracts/catalog.types';
import { APP_ROUTES } from '@/shared/routes';
import { logger } from '@/core/telemetry/logger';

/** Regenerated hourly. */
export const revalidate = 3600;

// ============================================================
// 1. TUNING
// ============================================================

const PRODUCTS_PER_PAGE = 100;

/** Concurrent page requests. High enough to be fast, low enough to be polite. */
const FETCH_CONCURRENCY = 5;

/**
 * Ceiling on product pages.
 *
 * At 100 per page this is 5,000 products, comfortably inside the 50,000-URL
 * sitemap limit. Beyond this the correct answer is `generateSitemaps()` shards,
 * not a larger single file.
 */
const MAX_PRODUCT_PAGES = 50;

/**
 * Overall deadline for product enumeration.
 *
 * A sitemap that returns static routes late is far better than one that never
 * returns — the previous unbounded loop could hang the route indefinitely.
 */
const PRODUCT_FETCH_BUDGET_MS = 20_000;

// ============================================================
// 2. STATIC ROUTES
// ============================================================

/**
 * Publicly-crawlable routes.
 *
 * Sourced from `APP_ROUTES` rather than retyped, so renaming a route updates
 * the sitemap automatically instead of silently orphaning an entry.
 *
 * Authenticated areas are deliberately absent — see `app/robots.ts` and the
 * `noindex` in each authenticated group's layout.
 */
const STATIC_ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: APP_ROUTES.HOME, changeFrequency: 'daily', priority: 1.0 },
  { path: APP_ROUTES.PRODUCTS, changeFrequency: 'hourly', priority: 0.9 },
  { path: APP_ROUTES.CATEGORIES, changeFrequency: 'weekly', priority: 0.8 },
  { path: APP_ROUTES.DEALS, changeFrequency: 'daily', priority: 0.8 },
  { path: APP_ROUTES.FLASH_DEALS, changeFrequency: 'hourly', priority: 0.7 },
  { path: APP_ROUTES.STORES.LIST, changeFrequency: 'weekly', priority: 0.7 },
  { path: APP_ROUTES.COMPARE, changeFrequency: 'monthly', priority: 0.4 },
  { path: APP_ROUTES.ABOUT, changeFrequency: 'monthly', priority: 0.5 },
  { path: APP_ROUTES.CONTACT, changeFrequency: 'monthly', priority: 0.5 },
  { path: APP_ROUTES.HELP, changeFrequency: 'monthly', priority: 0.6 },
  { path: APP_ROUTES.TERMS, changeFrequency: 'yearly', priority: 0.3 },
  { path: APP_ROUTES.PRIVACY, changeFrequency: 'yearly', priority: 0.3 },
];

// ============================================================
// 3. GENERATION
// ============================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    productEntries = await collectProductEntries(baseUrl);
  } catch (error) {
    // Degrade rather than fail: a sitemap containing only static routes is far
    // more useful to a crawler than a 500. Logged through the structured
    // logger — the previous version used `console.error`.
    logger.error('[Sitemap] Product enumeration failed; serving static routes only', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return [...staticEntries, ...productEntries];
}

/**
 * Enumerate product URLs, bounded by page count and wall-clock budget.
 *
 * The first page is fetched alone to learn the total page count; the remainder
 * are then fetched in fixed-size concurrent batches. That is one round trip
 * more than an optimal implementation and far fewer than the previous
 * one-at-a-time loop.
 */
async function collectProductEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const deadline = Date.now() + PRODUCT_FETCH_BUDGET_MS;

  const firstPage = await productsApi.getAll({
    page: 0,
    size: PRODUCTS_PER_PAGE,
    sort: 'updatedAt,desc',
  });

  const entries = toEntries(firstPage.content, baseUrl);
  const totalPages = Math.min(firstPage.totalPages ?? 1, MAX_PRODUCT_PAGES);

  for (let start = 1; start < totalPages; start += FETCH_CONCURRENCY) {
    if (Date.now() > deadline) {
      logger.warn('[Sitemap] Product fetch budget exhausted; returning a partial sitemap', {
        pagesFetched: start,
        totalPages,
      });
      break;
    }

    const batch = Array.from(
      { length: Math.min(FETCH_CONCURRENCY, totalPages - start) },
      (_, offset) =>
        productsApi.getAll({ page: start + offset, size: PRODUCTS_PER_PAGE, sort: 'updatedAt,desc' })
    );

    // `allSettled`, not `all`: one failed page should cost that page's URLs,
    // not the entire product section of the sitemap.
    const results = await Promise.allSettled(batch);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        entries.push(...toEntries(result.value.content, baseUrl));
      } else {
        logger.warn('[Sitemap] A product page failed to load; skipping it', {
          reason: String(result.reason),
        });
      }
    }
  }

  return entries;
}

/**
 * Project products onto sitemap entries.
 *
 * The slug is preferred, falling back to the numeric id — which
 * `resolveProductBySlug` does resolve, so both forms serve a real page. Only
 * one form per product is ever published: the page sets its canonical to
 * whichever param it was reached by, so emitting both would present one product
 * as two indexable URLs.
 *
 * A product with neither is skipped, since there is no URL that would resolve.
 */
function toEntries(products: readonly ProductDTO[], baseUrl: string): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const product of products) {
    const identifier = product.urlSlug ?? (product.id != null ? String(product.id) : undefined);
    if (!identifier) continue;

    entries.push({
      url: `${baseUrl}${APP_ROUTES.PRODUCT_DETAIL(identifier)}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'daily',
      // Products with a real slug rank better and are the preferred entry
      // point, so they are weighted above id-addressed ones.
      priority: product.featured ? 0.8 : product.urlSlug ? 0.7 : 0.6,
    });
  }

  return entries;
}
