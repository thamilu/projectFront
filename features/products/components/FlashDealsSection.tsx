import Image from 'next/image';
import Link from 'next/link';
import { productApi } from '@/features/products/api/product-api';
import { fetchHomepageSectionData, padWithDemoData } from '@/features/products/utils/fetch-with-fallback';
import { PreviewBadge } from '@/features/products/components/PreviewBadge';
import { FLASH_DEALS_PLACEHOLDERS as demoDeals } from '@/features/products/constants/placeholders';
import { PRODUCT_FORM_CONSTANTS } from '@/features/products/constants';
import { PlaceholderAwareLink } from './PlaceholderAwareLink';
import { APP_ROUTES } from '@/shared/routes';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { ChevronRight, Flame, Timer, TrendingDown } from 'lucide-react';

const FLASH_DEALS_CONFIG = {
  badge: {
    icon: Flame,
    text: 'Live Flash Sale',
  },
  heading: {
    main: 'Hurry Up!',
    highlight: 'Big Deals',
    suffix: 'End Soon',
  },
  // No backend field tracks a deal's actual expiry, so this deliberately
  // avoids a fake countdown clock (previously a static "02:45:12" that never
  // moved) — see FlashDealsSection review notes.
  subheading: {
    icon: Timer,
    text: 'Limited quantities available at these prices — while supplies last.',
  },
  action: {
    label: 'Explore All Deals',
    href: APP_ROUTES.PRODUCTS,
  },
  card: {
    lowStockLabel: 'Only',
    lowStockSuffix: 'left',
  },
};

import { formatMoney, type Cents, getDiscountPercentage } from '@/shared/utils';

interface FlashDeal {
  id: number | string;
  image: string;
  title: string;
  description?: string;
  price: number; // in cents
  oldPrice?: number; // in cents
  /** Real remaining stock, when known — only sourced from the live API, never
   * fabricated for demo/fallback items. Drives the low-stock badge below. */
  stockQuantity?: number;
  lowStockThreshold?: number;
  isDemo?: boolean;
}

const formatPrice = (priceCents: number) => formatMoney(priceCents as Cents, 'INR');
const MIN_FLASH_DEALS = 4;

export async function FlashDealsSection() {
  const { badge, heading, subheading, action, card } = FLASH_DEALS_CONFIG;
  const BadgeIcon = badge.icon;
  const SubheadingIcon = subheading.icon;

  const fetched = await fetchHomepageSectionData<FlashDeal>('FlashDealsSection', async () => {
    const response = await productApi.getProducts({
      page: 0,
      size: 4,
      sort: 'discountPrice,desc',
    });
    return (response?.content || []).map((p) => ({
      id: p.id,
      image: p.imageUrl || '/images/placeholder.svg',
      title: p.name,
      description: p.description,
      price: Math.round((p.discountPrice || p.price) * 100),
      oldPrice: p.discountPrice ? Math.round(p.price * 100) : undefined,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
    }));
  });

  const flashDeals: FlashDeal[] = padWithDemoData(
    fetched,
    demoDeals as unknown as FlashDeal[],
    MIN_FLASH_DEALS
  );

  return (
    <section className="py-12 sm:py-16" aria-labelledby="flash-deals-heading">
      {/*
        The dark treatment is a PANEL inside the container, not a full-bleed
        band on the <section>.

        Previously `bg-slate-950` sat on the <section>, so it ran edge to edge
        while every neighbouring section's content stopped at the container's
        max-width. Only two sections on the homepage carry a strong background
        colour — this one and the app-download gradient — so those two read as
        full-width while everything else read as a centred column, and the page
        appeared to switch width as you scrolled. Constraining the panel gives
        every section one visible left and right edge.
      */}
      <div className="container mx-auto">
        <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 lg:p-10">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold tracking-widest text-red-400 uppercase">
              <BadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {badge.text}
            </div>
            <h2
              id="flash-deals-heading"
              className="mb-3 text-2xl font-semibold tracking-normal text-white sm:text-3xl"
            >
              {heading.main} <span className="text-red-500">{heading.highlight}</span>{' '}
              {heading.suffix}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <SubheadingIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                <p>{subheading.text}</p>
              </div>
            </div>
          </div>

          <Link
            href={action.href}
            className="group flex items-center gap-3 text-sm font-bold text-white transition-colors hover:text-red-400"
          >
            {action.label}
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 transition-colors group-hover:border-red-500/50 group-hover:bg-red-500/10">
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {flashDeals.slice(0, 4).map((deal) => {
            const discount = getDiscountPercentage(deal.price, deal.oldPrice);
            const lowStockThreshold =
              deal.lowStockThreshold ?? PRODUCT_FORM_CONSTANTS.DEFAULT_LOW_STOCK_THRESHOLD;
            const isLowStock =
              typeof deal.stockQuantity === 'number' && deal.stockQuantity <= lowStockThreshold;

            return (
              <PlaceholderAwareLink
                key={deal.id}
                isPlaceholder={deal.isDemo}
                href={APP_ROUTES.PRODUCT_DETAIL(deal.id.toString())}
                className="group relative block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Card className="h-full overflow-hidden border-slate-800 bg-slate-950 transition-colors duration-200 hover:border-red-500/60 hover:shadow-md">
                  <CardContent className="flex h-full flex-col items-center p-0">
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                      <Image
                        src={deal.image}
                        alt={deal.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized={deal.isDemo}
                      />

                      {discount && (
                        <div className="absolute top-3 left-3 z-20">
                          <div className="flex items-center gap-1 rounded-sm bg-red-600 px-2 py-1 text-[10px] font-black tracking-normal text-white uppercase shadow-sm">
                            <TrendingDown className="h-3 w-3" aria-hidden="true" />
                            {discount}% OFF
                          </div>
                        </div>
                      )}

                      {deal.isDemo && (
                        <PreviewBadge className="absolute top-3 right-3 z-20" />
                      )}
                    </div>

                    <div className="flex w-full flex-grow flex-col items-center p-4 text-center">
                      <h3 className="mb-3 line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-white uppercase transition-colors group-hover:text-red-400 sm:text-base">
                        {deal.title}
                      </h3>

                      <div className="mb-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                        <span className="text-lg font-bold text-white sm:text-xl">
                          {formatPrice(deal.price)}
                        </span>
                        {deal.oldPrice && (
                          <span className="text-sm font-semibold text-slate-500 line-through">
                            {formatPrice(deal.oldPrice)}
                          </span>
                        )}
                      </div>

                      {isLowStock && (
                        <div className="mt-auto w-full">
                          <p className="text-center text-[10px] font-black tracking-widest text-red-500 uppercase">
                            {card.lowStockLabel} {deal.stockQuantity} {card.lowStockSuffix}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </PlaceholderAwareLink>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
