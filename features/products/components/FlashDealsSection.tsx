import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Timer, Flame, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productApi, isBackendDown } from '@/features/products/api/product-api';
import { flashDeals as demoDeals } from '@/constants/demoData';
import { APP_ROUTES } from '@/constants/routes/app-routes';

// ============================================================================
// Constants & Configuration
// ============================================================================

/**
 * Enterprise Flash Deals Configuration
 */
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
  countdown: {
    icon: Timer,
    placeholder: '02:45:12',
    label: 'Limited quantities available at these prices.',
  },
  action: {
    label: 'Explore All Deals',
    href: APP_ROUTES.PRODUCTS,
  },
  card: {
    soldLabel: 'Sold:',
    leftLabel: 'Only',
    leftSuffix: 'Left',
  }
};

interface FlashDeal {
  id: number | string;
  image: string;
  title: string;
  description?: string;
  price: number;
  oldPrice?: number;
  isDemo?: boolean;
}

// ============================================================================
// Utilities
// ============================================================================

const formatPrice = (price: number, locale = 'en-IN', currency = 'INR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);

function getDiscountPercentage(price: number, oldPrice?: number): number | null {
  if (typeof oldPrice !== 'number' || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

// ============================================================================
// Component
// ============================================================================

export async function FlashDealsSection() {
  const { badge, heading, countdown, action, card } = FLASH_DEALS_CONFIG;
  const BadgeIcon = badge.icon;
  const CountdownIcon = countdown.icon;

  let flashDeals: FlashDeal[] = [];
  try {
    const response = await productApi.getProducts({ page: 0, size: 4, sort: 'discountPrice,desc' });
    flashDeals = (response?.content || []).map((p) => ({
      id: p.id,
      image: p.imageUrl || '/images/placeholder.svg',
      title: p.name,
      description: p.description,
      price: p.discountPrice || p.price,
      oldPrice: p.discountPrice ? p.price : undefined,
    }));
  } catch (error: any) {
    if (isBackendDown(error)) {
      console.warn('[FlashDealsSection] Backend unreachable. Using trending demo deals.');
    } else if (error?.status === 401 || String(error?.message || '').includes('401')) {
      console.warn('[FlashDealsSection] Unauthorized (401). Using trending demo deals for guests.');
    } else {
      // Non-critical homepage section: fall back without surfacing a dev overlay error.
      console.warn('[FlashDealsSection] Failed to fetch flash deals. Using demo deals.', error?.message || error);
    }
  }

  // Robustness: Ensure we always have at least 4 high-quality items for a full row
  if (!flashDeals || flashDeals.length < 4) {
    const existingIds = new Set(flashDeals.map(d => d.id));
    const placeholders = demoDeals
      .filter(d => !existingIds.has(d.id))
      .map(d => ({
        ...d,
        image: `/images/products/deal-${d.id}.svg`,
        isDemo: true
      }));
    flashDeals = [...flashDeals, ...placeholders].slice(0, 4);
  }

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900" aria-labelledby="flash-deals-heading">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(239,68,68,0.1),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.1),transparent_40%)]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-6">
              <BadgeIcon className="w-3.5 h-3.5" />
              {badge.text}
            </div>
            <h2 id="flash-deals-heading" className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
              {heading.main} <br />
              <span className="text-red-500">{heading.highlight}</span> {heading.suffix}
            </h2>
            <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-2">
                <CountdownIcon className="w-5 h-5 text-red-500" />
                <span className="font-mono font-bold text-white">{countdown.placeholder}</span>
              </div>
              <span className="hidden sm:block">|</span>
              <p className="hidden sm:block">{countdown.label}</p>
            </div>
          </div>

          <Link
            href={action.href}
            className="group flex items-center gap-3 text-white font-bold hover:text-red-500 transition-colors"
          >
            {action.label}
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-all">
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {flashDeals.slice(0, 4).map((deal) => {
            const discount = getDiscountPercentage(deal.price, deal.oldPrice);
            
            return (
              <Link
                key={deal.id}
                href={APP_ROUTES.PRODUCT_DETAIL(deal.id.toString())}
                className="group relative block h-full focus:outline-none"
              >
                <Card className="h-full overflow-hidden border-slate-800 bg-slate-950 transition-all duration-500 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/10">
                  <CardContent className="p-0 flex flex-col items-center h-full">
                    {/* Image Area with Zoom & Discount Badge */}
                    <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={deal.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized={deal.isDemo}
                      />

                      {discount && (
                        <div className="absolute top-4 left-4 z-20">
                          <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-sm shadow-xl flex items-center gap-1 uppercase tracking-tighter animate-pulse">
                            <TrendingDown className="w-3 h-3" />
                            {discount}% OFF
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Content Area */}
                    <div className="p-6 w-full flex flex-col flex-grow items-center text-center">
                      <h3 className="font-bold text-lg text-white mb-2 group-hover:text-red-500 transition-colors line-clamp-1 uppercase tracking-tight">
                        {deal.title}
                      </h3>

                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl font-black text-white">
                          {formatPrice(deal.price)}
                        </span>
                        {deal.oldPrice && (
                          <span className="text-sm line-through text-slate-500 font-bold italic">
                            {formatPrice(deal.oldPrice)}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto w-full">
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                          <div className="h-full bg-red-600 w-3/4 animate-shimmer" />
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span>{card.soldLabel} 142</span>
                          <span className="text-red-500">{card.leftLabel} 8 {card.leftSuffix}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
