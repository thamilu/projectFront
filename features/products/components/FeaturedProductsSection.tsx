import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from '@/features/cart';
import { productApi } from '@/features/products/api/product-api';
import { fetchHomepageSectionData, padWithDemoData } from '@/features/products/utils/fetch-with-fallback';
import { PreviewBadge } from '@/features/products/components/PreviewBadge';
import { FEATURED_PRODUCTS_PLACEHOLDERS as demoProducts } from '@/features/products/constants/placeholders';
import { APP_ROUTES } from '@/shared/routes';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { cn, isValidImageUrl } from '@/shared/utils';
import { ChevronRight, Star } from 'lucide-react';

const FEATURED_PRODUCTS_CONFIG = {
  heading: 'Featured Products',
  subheading:
    'Our most popular enterprise-grade solutions, handpicked for quality and performance.',
  action: {
    label: 'View Collection',
    mobileLabel: 'Explore Featured Collection',
    href: APP_ROUTES.PRODUCTS,
  },
  card: {
    detailsLabel: 'Details',
  },
};

import { formatMoney, type Cents } from '@/shared/utils';

const formatPrice = (priceCents: number) => formatMoney(priceCents as Cents, 'INR');

interface FeaturedProductItem {
  id: number;
  image: string;
  title: string;
  description?: string;
  price: number; // in cents
  oldPrice?: number; // in cents
  /** Real aggregate rating, when known — only sourced from the live API,
   * never fabricated for demo items. The star row below renders nothing
   * (rather than a fake perfect score) when this is undefined. */
  averageRating?: number;
  reviewCount?: number;
  isDemo?: boolean;
}

const MIN_FEATURED_PRODUCTS = 4;

export async function FeaturedProductsSection() {
  const { heading, subheading, action, card } = FEATURED_PRODUCTS_CONFIG;

  const fetched = await fetchHomepageSectionData<FeaturedProductItem>('FeaturedProductsSection', async () => {
    const response = await productApi.getProducts({ page: 0, size: 8, featured: true });
    return (response?.content || []).map((p) => ({
      id: p.id,
      image: isValidImageUrl(p.imageUrl) ? (p.imageUrl as string) : '/images/placeholder.svg',
      title: p.name,
      description: p.description,
      price: Math.round((p.discountPrice || p.price) * 100),
      oldPrice: p.discountPrice ? Math.round(p.price * 100) : undefined,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
    }));
  });

  const featuredProducts: FeaturedProductItem[] = padWithDemoData(
    fetched,
    demoProducts as unknown as FeaturedProductItem[],
    MIN_FEATURED_PRODUCTS
  );

  return (
    <section className="bg-background py-12 sm:py-16" aria-labelledby="featured-products-heading">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2
              id="featured-products-heading"
              className="text-foreground mb-3 text-2xl font-semibold tracking-normal sm:text-3xl"
            >
              {heading}
            </h2>
            <p className="text-muted-foreground text-sm leading-6 sm:text-base">{subheading}</p>
          </div>

          <Button variant="outline" asChild size="lg" className="group hidden md:inline-flex">
            <Link href={action.href}>
              {action.label}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {featuredProducts.slice(0, 4).map((product) => (
            <Card
              key={product.id}
              className="group border-border/80 bg-card hover:border-primary/40 relative h-full overflow-hidden transition-colors duration-200 hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col items-start p-0">
                <div className="bg-muted relative aspect-square w-full overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={product.isDemo}
                  />

                  {product.isDemo && (
                    <PreviewBadge className="absolute top-2 right-2 z-10" />
                  )}

                  {/*
                    No Add to Cart on placeholder content.

                    Placeholders are static filler used when the catalogue holds
                    fewer products than this section shows — they have no
                    backing record, and their ids collide with real ones (see
                    PlaceholderAwareLink). Offering to add one to the cart is
                    the most damaging affordance on the card: it either fails,
                    or adds an unrelated real product at a price the shopper
                    never saw.
                  */}
                  {!product.isDemo && (
                    <div className="absolute inset-x-3 bottom-3 translate-y-10 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      <AddToCartButton product={product} />
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-grow flex-col p-4">
                  {/* Real aggregate rating only — no rating row at all (rather
                      than a fabricated perfect score) when the product has
                      none yet, e.g. demo items or genuinely unrated products. */}
                  {typeof product.averageRating === 'number' && (
                    <div className="mb-3 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          aria-hidden="true"
                          className={cn(
                            'h-3 w-3',
                            i < Math.round(product.averageRating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                      <span className="text-muted-foreground ml-1 text-[10px] font-bold tracking-widest">
                        {product.averageRating.toFixed(1)}
                        {typeof product.reviewCount === 'number' && ` (${product.reviewCount})`}
                      </span>
                    </div>
                  )}

                  <h3 className="text-card-foreground group-hover:text-primary mb-2 line-clamp-2 min-h-10 text-sm leading-5 font-semibold transition-colors sm:text-base">
                    {product.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2 min-h-10 text-sm leading-5">
                    {product.description}
                  </p>

                  <div className="border-border/70 mt-auto flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col">
                      <span className="text-primary text-lg font-bold">
                        {formatPrice(product.price)}
                      </span>
                      {product.oldPrice && (
                        <span className="text-muted-foreground text-xs font-medium line-through">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                    </div>
                    {/*
                      "Details" is hidden entirely on a placeholder rather than
                      rendered inert: unlike a whole card, a lone call-to-action
                      that does nothing reads as broken. See
                      PlaceholderAwareLink for why placeholder ids cannot be
                      navigated to.
                    */}
                    {!product.isDemo && (
                      <Link
                        href={APP_ROUTES.PRODUCT_DETAIL(product.id.toString())}
                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-bold tracking-wider uppercase"
                      >
                        {card.detailsLabel}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 md:hidden">
          <Button variant="outline" asChild className="h-11 w-full">
            <Link href={action.href} className="flex items-center justify-center gap-2">
              {action.mobileLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
