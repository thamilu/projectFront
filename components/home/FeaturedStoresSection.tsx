/**
 * FeaturedStoresSection — Async Server Component
 *
 * Fetches and renders a horizontal scroll of seller stores.
 * Follows the same pattern as FeaturedProductsSection (async SSC + error boundary).
 * Empty state: friendly CTA to motivate seller registration.
 */
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { ArrowRight, ChevronRight, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/observability/logger';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { serverFetch } from '@/lib/server-api-client';
import { siteConfig } from '@/lib/config/site';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import {
  getStoreDisplayName,
  getStoreInitials,
  getStoreAvatarColor,
} from '@/lib/store/store-helpers';
import styles from './FeaturedStoresSection.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShopSummary {
  id: number;
  shopName?: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  productCount?: number;
  rating?: number;
}

const ShopSummarySchema = z
  .object({
    id: z.coerce.number(),
    shopName: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    productCount: z.coerce.number().optional(),
    rating: z.coerce.number().optional(),
  })
  .passthrough();

const FeaturedStoresResponseSchema = z.union([
  z
    .object({
      data: z
        .object({
          content: z.array(ShopSummarySchema),
        })
        .passthrough(),
    })
    .passthrough(),
  z
    .object({
      content: z.array(ShopSummarySchema),
    })
    .passthrough(),
  z.array(ShopSummarySchema),
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fetch stores using the authenticated server-side fetch wrapper */
async function fetchStores(size = 10): Promise<ShopSummary[]> {
  try {
    // serverFetch automatically concatenates the base API URL and injects the user's
    // NextAuth Bearer token if they are logged in, preventing 401 errors.
    const response = await serverFetch<unknown>(
      `${API_ENDPOINTS.STORES.LIST}?page=0&size=${size}`,
      { next: { revalidate: 60 } } // Cache the featured stores for 60 seconds
    );

    const parsed = FeaturedStoresResponseSchema.safeParse(response);
    if (!parsed.success) {
      logger.warn('[FeaturedStores] Unexpected response shape. Showing empty state.', {
        issues: parsed.error.issues,
      });
      return [];
    }

    const value = parsed.data;
    if (Array.isArray(value)) return value as ShopSummary[];

    if (
      'data' in value &&
      value.data &&
      typeof value.data === 'object' &&
      'content' in value.data
    ) {
      const content = (value.data as { content?: unknown }).content;
      return Array.isArray(content) ? (content as ShopSummary[]) : [];
    }

    if ('content' in value) {
      const content = (value as { content?: unknown }).content;
      return Array.isArray(content) ? (content as ShopSummary[]) : [];
    }

    return [];
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string; name?: string };
    if (err?.status === 401 || String(err?.message).includes('401')) {
      // Silently fail for guests since stores might uniquely require authorization
      logger.debug('[FeaturedStores] Guest user skipping stores fetch (401).');
    } else if (
      err?.status === 0 ||
      String(err?.message || '')
        .toLowerCase()
        .includes('fetch failed')
    ) {
      // Non-critical homepage section: backend offline / network issue
      logger.warn('[FeaturedStores] Backend unreachable. Showing empty state.');
    } else {
      // Non-critical homepage section: don't surface a dev overlay error.
      logger.warn('[FeaturedStores] Failed to fetch featured stores. Showing empty state.', {
        message: err?.message,
        status: err?.status,
        name: err?.name,
      });
    }
    return [];
  }
}

// ─── Store Card ───────────────────────────────────────────────────────────────

function StoreCard({ shop }: { shop: ShopSummary }) {
  const name = getStoreDisplayName(shop);
  const initials = getStoreInitials(name);
  const color = getStoreAvatarColor(shop.id);

  return (
    <Link
      href={APP_ROUTES.STORES.DETAIL(String(shop.id))}
      className={cn(styles.storeCard, 'group flex-shrink-0')}
      aria-label={`Visit ${name}`}
    >
      {/* Avatar */}
      <div className={styles.avatarWrap}>
        {shop.logoUrl ? (
          <Image
            src={shop.logoUrl}
            alt={`${name} logo`}
            fill
            sizes="56px"
            className={styles.avatarImg}
          />
        ) : (
          <div
            className={styles.avatarInitials}
            style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.storeInfo}>
        <h3 className={styles.storeName}>{name}</h3>
        {shop.description && <p className={styles.storeDesc}>{shop.description}</p>}
        <div className={styles.storeMeta}>
          {typeof shop.productCount === 'number' && (
            <span className={styles.storeBadge}>{shop.productCount} Products</span>
          )}
          {typeof shop.rating === 'number' && (
            <span className={styles.storeRating}>⭐ {shop.rating.toFixed(1)}</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className={styles.storeCta}>
        <ArrowRight className="h-4 w-4 text-indigo-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
      </div>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyStores() {
  return (
    <div className={styles.storesEmpty}>
      <div className={styles.storesEmptyIcon}>
        <Store className="h-8 w-8 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold">No stores yet</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Be among the first sellers on {siteConfig.name}!
      </p>
      <Button asChild size="sm" className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700">
        <Link href="/become-seller">Open Your Store →</Link>
      </Button>
    </div>
  );
}

// ─── Main Section Component ────────────────────────────────────────────────────

export async function FeaturedStoresSection() {
  const stores = await fetchStores(10);

  return (
    <section className="py-10 md:py-14" aria-labelledby="featured-stores-heading">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="featured-stores-heading"
              className="text-2xl font-black tracking-tight md:text-3xl"
            >
              <Store className="mr-2 inline-block h-6 w-6 align-sub text-indigo-500" />
              Featured Stores
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Shop directly from our trusted sellers
            </p>
          </div>
          <Button
            variant="ghost"
            asChild
            className="hidden items-center gap-1 text-indigo-600 hover:text-indigo-700 md:inline-flex"
          >
            <Link href={APP_ROUTES.STORES.LIST}>
              All Stores <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Content */}
        {stores.length === 0 ? (
          <EmptyStores />
        ) : (
          <>
            {/* Horizontal scroll row */}
            <div
              className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              role="list"
              aria-label="Featured stores"
            >
              {stores.map((shop) => (
                <div key={shop.id} role="listitem">
                  <StoreCard shop={shop} />
                </div>
              ))}
            </div>

            {/* Mobile CTA */}
            <div className="mt-4 md:hidden">
              <Button variant="outline" asChild className="w-full">
                <Link href={APP_ROUTES.STORES.LIST}>
                  View All Stores <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
