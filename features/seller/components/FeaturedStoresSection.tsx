/**
 * FeaturedStoresSection â€” Async Server Component
 *
 * Fetches and renders a horizontal scroll of seller stores.
 * Follows the same pattern as FeaturedProductsSection (async SSC + error boundary).
 * Empty state: friendly CTA to motivate seller registration.
 */
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { ArrowRight, ChevronRight, Store } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { cn, isValidImageUrl } from '@/shared/utils';
import { logger } from '@/core/telemetry/logger';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { apiClient } from '@/core/client';
import { siteConfig } from '@/core/config/site';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';
import {
  getStoreDisplayName,
  getStoreInitials,
  getStoreAvatarColor,
} from '@/shared/store/store-helpers';
// Remove CSS module import
// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    shopName: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    productCount: z.coerce.number().nullable().optional(),
    rating: z.coerce.number().nullable().optional(),
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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Fetch stores using the authenticated server-side fetch wrapper */
async function fetchStores(size = 10): Promise<ShopSummary[]> {
  try {
    const { data: response } = await apiClient.get<unknown>(
      `${API_ENDPOINTS.STORES.LIST}?page=0&size=${size}`
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

// â”€â”€â”€ Store Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StoreCard({ shop }: { shop: ShopSummary }) {
  const name = getStoreDisplayName(shop);
  const initials = getStoreInitials(name);
  const color = getStoreAvatarColor(shop.id);
  const hasValidLogo = isValidImageUrl(shop.logoUrl);

  return (
    <Link
      href={APP_ROUTES.STORES.DETAIL(String(shop.id))}
      className={cn('flex flex-col w-[180px] rounded-2xl bg-white border-[1.5px] border-black/5 p-4 pt-4 pb-3.5 cursor-pointer transition-all duration-200 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/35 dark:bg-slate-800 dark:border-white/10 relative overflow-hidden', 'group shrink-0')}
      aria-label={`Visit ${name}`}
    >
      {/* Avatar */}
      <div className="w-14 h-14 rounded-xl overflow-hidden mb-3 shadow-sm shrink-0 relative">
        {hasValidLogo ? (
          <Image
            src={shop.logoUrl!}
            alt={`${name} logo`}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[18px] font-extrabold text-white tracking-wide"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            aria-hidden="true"
          >
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-bold leading-snug line-clamp-2 mb-1">{name}</h3>
        {shop.description && <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">{shop.description}</p>}
        <div className="flex items-center flex-wrap gap-1">
          {typeof shop.productCount === 'number' && (
            <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">{shop.productCount} Products</span>
          )}
          {typeof shop.rating === 'number' && (
            <span className="text-[10px] text-stone-500 font-medium">â­ {shop.rating.toFixed(1)}</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
        <ArrowRight className="h-4 w-4 text-indigo-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
      </div>
    </Link>
  );
}

// â”€â”€â”€ Empty State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function EmptyStores() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[180px] text-center p-6 w-full">
      <div className="w-14 h-14 rounded-xl bg-linear-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-3">
        <Store className="h-8 w-8 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold">No stores yet</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Be among the first sellers on {siteConfig.name}!
      </p>
      <Button asChild size="sm" className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700">
        <Link href="/become-seller">Open Your Store â†’</Link>
      </Button>
    </div>
  );
}

// â”€â”€â”€ Main Section Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
