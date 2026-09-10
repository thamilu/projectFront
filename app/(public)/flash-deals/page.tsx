import Image from 'next/image';
import Link from 'next/link';
import { Flame, Zap } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { AddToCartButton } from '@/features/cart';
import { APP_ROUTES } from '@/shared/routes';
import { productApi, isBackendDown } from '@/features/products/api/product-api';
import { isBackendAvailable } from '@/core/client/backend-health';
import { FLASH_DEALS_PLACEHOLDERS as demoDeals } from '@/features/products/constants/placeholders';
import { formatMoney, type Cents, getDiscountPercentage } from '@/shared/utils';
import { logger } from '@/core/telemetry/logger';

const formatPrice = (priceCents: number) => formatMoney(priceCents as Cents, 'INR');

// Below this, "low stock" is a genuine signal worth surfacing; above it,
// showing a number would just be fabricated urgency with no real backing.
const LOW_STOCK_THRESHOLD = 20;

interface FlashDealItem {
  id: number | string;
  slug?: string;
  image: string;
  title: string;
  price: number; // cents
  oldPrice?: number; // cents
  stockQuantity?: number;
  isDemo?: boolean;
}

async function loadFlashDeals(): Promise<FlashDealItem[]> {
  if (!(await isBackendAvailable())) return [];

  try {
    const response = await productApi.getProducts({
      page: 0,
      size: 12,
      sort: 'discountPrice,desc',
    });
    return (response?.content ?? [])
      .filter((p) => p.discountPrice != null)
      .map((p) => ({
        id: p.id,
        slug: p.urlSlug,
        image: p.imageUrl || '/images/placeholder.svg',
        title: p.name,
        price: Math.round((p.discountPrice ?? p.price) * 100),
        oldPrice: Math.round(p.price * 100),
        stockQuantity: p.stockQuantity,
      }));
  } catch (error) {
    if (!isBackendDown(error)) {
      logger.warn('[FlashDealsPage] Failed to fetch flash deals, falling back to demo deals', {
        component: 'app/(public)/flash-deals',
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return [];
  }
}

export default async function FlashDealsPage() {
  let deals = await loadFlashDeals();

  if (deals.length < 4) {
    const existingIds = new Set(deals.map((d) => d.id));
    const placeholders = demoDeals
      .filter((d) => !existingIds.has(d.id))
      .map((d) => ({ ...d, isDemo: true }));
    deals = [...deals, ...placeholders].slice(0, 12);
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900">
          <Zap className="h-5 w-5 text-red-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Flash Deals</h1>
          <p className="text-muted-foreground text-sm">
            Our steepest current discounts — while stock lasts.
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="bg-card/60 rounded-3xl border p-10 text-center shadow-sm">
          <Flame className="text-muted-foreground/40 mx-auto mb-4 h-12 w-12" aria-hidden="true" />
          <p className="text-foreground text-lg font-semibold">No flash deals available right now</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Check back soon, or{' '}
            <Link href={APP_ROUTES.PRODUCTS} className="text-primary underline underline-offset-4">
              browse the full catalog
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => {
            const discount = getDiscountPercentage(deal.price, deal.oldPrice);
            const href = APP_ROUTES.PRODUCT_DETAIL(String(deal.slug || deal.id));
            const showLowStock =
              !deal.isDemo &&
              typeof deal.stockQuantity === 'number' &&
              deal.stockQuantity > 0 &&
              deal.stockQuantity <= LOW_STOCK_THRESHOLD;

            return (
              <Card
                key={deal.id}
                className="group overflow-hidden border-red-200 shadow-sm transition-shadow hover:shadow-lg dark:border-red-900"
              >
                <Link href={href} className="block">
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
                    <Image
                      src={deal.image}
                      alt={deal.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={deal.isDemo}
                    />
                    {discount && (
                      <Badge className="absolute top-3 left-3 bg-red-600 text-white">
                        {discount}% OFF
                      </Badge>
                    )}
                    {showLowStock && (
                      <Badge
                        variant="outline"
                        className="absolute top-3 right-3 border-red-300 bg-white/90 text-xs text-red-600"
                      >
                        Only {deal.stockQuantity} left!
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link
                    href={href}
                    className="hover:text-primary line-clamp-1 font-semibold hover:underline"
                  >
                    {deal.title}
                  </Link>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-red-600">
                      {formatPrice(deal.price)}
                    </span>
                    {deal.oldPrice && (
                      <span className="text-muted-foreground text-sm line-through">
                        {formatPrice(deal.oldPrice)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <AddToCartButton product={{ id: Number(deal.id), title: deal.title }} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
