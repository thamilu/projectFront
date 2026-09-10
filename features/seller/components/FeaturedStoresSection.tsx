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
import { ArrowRight, ChevronRight, Store, Star } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn, isValidImageUrl } from '@/shared/utils';
import { logger } from '@/core/telemetry/logger';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { apiClient } from '@/core/client';
import { siteConfig } from '@/core/config/site';
import { APP_ROUTES } from '@/shared/routes';
import {
  getStoreDisplayName,
  getStoreInitials,
  getStoreAvatarColor,
} from '@/shared/store/store-helpers';
import { sanitizeCSSValue } from '@/lib/sanitize';
import { unstable_cache } from 'next/cache';

// ─── Types ─────────────────────────────────────────────────────────────

export interface ShopSummary {
  id: number;
  shopName?: string | null;
  name?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  productCount?: number | null;
  rating?: number | null;
}


const ShopSummarySchema = z
  .object({
    id: z.coerce.number(),
    shopName: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    productCount: z.coerce.number().nullable().optional(),
    rating: z.coerce.number().nullable().optional(),
  })
  .strip();

const FeaturedStoresResponseSchema = z.union([
  z
    .object({
      data: z
        .object({
          content: z.array(ShopSummarySchema),
        })
        .strip(),
    })
    .strip(),
  z
    .object({
      content: z.array(ShopSummarySchema),
    })
    .strip(),
  z.array(ShopSummarySchema),
]);

// ─── Helpers ────────────────────────────────────────────────────────────

interface ApiError {
  status?: number;
  message?: string;
  name?: string;
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null;
}

/** Fetch stores using the authenticated server-side fetch wrapper */
async function fetchStores(size = 10): Promise<ShopSummary[]> {
  try {
    // Clamp size parameter to prevent injection vectors
    const safeSize = Math.max(1, Math.min(size, 50));
    const { data: response } = await apiClient.get<unknown>(
      `${API_ENDPOINTS.STORES.LIST}?page=0&size=${safeSize}`
    );

    const parsed = FeaturedStoresResponseSchema.safeParse(response);
    if (!parsed.success) {
      logger.warn('[FeaturedStores] Unexpected response shape. Showing empty state.', {
        issues: parsed.error.issues,
      });
      return [];
    }

    const value = parsed.data;
    if (Array.isArray(value)) return value;

    if (
      'data' in value &&
      value.data &&
      typeof value.data === 'object' &&
      'content' in value.data
    ) {
      const content = value.data.content;
      return Array.isArray(content) ? content : [];
    }

    if ('content' in value) {
      const content = value.content;
      return Array.isArray(content) ? content : [];
    }

    return [];
  } catch (error: unknown) {
    if (isApiError(error)) {
      if (error.status === 401 || String(error.message).includes('401')) {
        // Silently fail for guests since stores might uniquely require authorization
        logger.debug('[FeaturedStores] Guest user skipping stores fetch (401).');
      } else if (
        error.status === 0 ||
        String(error.message || '')
          .toLowerCase()
          .includes('fetch failed')
      ) {
        // Non-critical homepage section: backend offline / network issue
        logger.warn('[FeaturedStores] Backend unreachable. Showing empty state.');
      } else {
        // Non-critical homepage section: don't surface a dev overlay error.
        logger.warn('[FeaturedStores] Failed to fetch featured stores. Showing empty state.', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
      }
    } else {
      logger.warn('[FeaturedStores] Non-API error fetching stores. Showing empty state.');
    }
    return [];
  }
}

/** Cache stores query wrapper to prevent homepage DoS amplification on backend API */
const getCachedFeaturedStores = unstable_cache(
  async (size: number) => fetchStores(size),
  ['featured-stores'],
  { revalidate: 300, tags: ['stores', 'featured-stores'] }
);

// ─── Store Card ────────────────────────────────────────────────────────

function StoreCard({ shop }: { shop: ShopSummary }) {
  const name = getStoreDisplayName(shop);
  const initials = getStoreInitials(name);
  const color = getStoreAvatarColor(shop.id);
  const hasValidLogo = isValidImageUrl(shop.logoUrl);

  // Generate and sanitize colors individually to secure inline dynamic styling
  const sanitizedColor = sanitizeCSSValue(color);
  const transparentColor = color.replace('hsl(', 'hsla(').replace(')', ', 0.6)');
  const sanitizedTransparentColor = sanitizeCSSValue(transparentColor);

  return (
    <Link
      href={APP_ROUTES.STORES.DETAIL(String(shop.id))}
      className={cn(
        'relative flex w-[180px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-4 pt-4 pb-3.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl dark:border-white/10 group shrink-0 snap-start'
      )}
      aria-label={`Visit ${name}`}
    >
      {/* Avatar */}
      <div className="relative mb-3 h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm bg-muted/20">
        {hasValidLogo && shop.logoUrl ? (
          <Image
            src={shop.logoUrl}
            alt={`${name} logo`}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[18px] font-extrabold tracking-wide text-white"
            style={{
              background: `linear-gradient(135deg, ${sanitizedColor}, ${sanitizedTransparentColor})`,
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 line-clamp-2 text-2xs leading-snug font-bold">{name}</h3>
        {shop.description && (
          <p className="mb-2 line-clamp-2 text-2xs leading-relaxed text-muted-foreground">
            {shop.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {typeof shop.productCount === 'number' && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xxs font-semibold text-primary">
              {shop.productCount} {shop.productCount === 1 ? 'Product' : 'Products'}
            </span>
          )}
          {typeof shop.rating === 'number' && (
            <span
              className="flex items-center gap-0.5 text-xxs font-medium text-muted-foreground"
              aria-label={`Rating: ${shop.rating.toFixed(1)} out of 5`}
            >
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {shop.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="absolute top-1/2 right-3.5 -translate-y-1/2">
        <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true" />
      </div>
    </Link>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────

function EmptyStores() {
  return (
    <div
      data-testid="featured-stores-empty"
      className="flex min-h-[180px] w-full flex-col items-center justify-center p-6 text-center"
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
        <Store className="h-8 w-8 text-primary/70" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">No stores yet</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Be among the first sellers on {siteConfig.name}!
      </p>
      <Button asChild size="sm" className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
        <Link href={APP_ROUTES.BECOME_SELLER}>
          Open Your Store <ArrowRight className="ml-1 inline-block h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

// ─── Main Section Component ────────────────────────────────────────────

export async function FeaturedStoresSection() {
  const stores = await getCachedFeaturedStores(10);

  return (
    <section
      data-testid="featured-stores-section"
      className="py-10 md:py-14"
      aria-labelledby="featured-stores-heading"
    >
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="featured-stores-heading"
              className="text-2xl font-black tracking-tight md:text-3xl"
            >
              <Store className="mr-2 inline-block h-6 w-6 align-sub text-primary" aria-hidden="true" />
              Featured Stores
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Shop directly from our trusted sellers
            </p>
          </div>
          <Button
            variant="ghost"
            asChild
            className="hidden items-center gap-1 text-primary hover:text-primary/80 md:inline-flex"
          >
            <Link href={APP_ROUTES.STORES.LIST}>
              All Stores <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {/* Content */}
        {stores.length === 0 ? (
          <EmptyStores />
        ) : (
          <>
            {/* Horizontal scroll row wrapper with fade gradients */}
            <div className="relative">
              <ul
                data-testid="featured-stores-list"
                className="hide-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                aria-label="Featured stores"
              >
                {stores.map((shop) => (
                  <li key={shop.id} className="shrink-0 snap-start" data-testid={`store-card-wrapper-${shop.id}`}>
                    <StoreCard shop={shop} />
                  </li>
                ))}
              </ul>

              {/* Right-edge fade overlay indicating more content */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-background to-transparent dark:from-background/90" />
            </div>

            {/* Mobile CTA */}
            <div className="mt-4 md:hidden">
              <Button variant="outline" asChild className="w-full">
                <Link href={APP_ROUTES.STORES.LIST}>
                  View All Stores <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
