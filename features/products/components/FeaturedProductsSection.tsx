import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { ChevronRight, Star } from 'lucide-react';
import { cn, isValidImageUrl } from '@/shared/utils';
import { productApi, isBackendDown } from '@/features/products/api/product-api';
import { AddToCartButton } from '@/features/cart';
import { featuredProducts as demoProducts } from '@/shared/constants/demoData';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

// ============================================================================
// Constants & Configuration
// ============================================================================

const FEATURED_PRODUCTS_CONFIG = {
  heading: 'Featured Products',
  subheading: 'Our most popular enterprise-grade solutions, handpicked for quality and performance.',
  action: {
    label: 'View Collection',
    mobileLabel: 'Explore Featured Collection',
    href: APP_ROUTES.PRODUCTS,
  },
  card: {
    badgeText: 'Top Rated',
    detailsLabel: 'Details',
  }
};

// ============================================================================
// Component
// ============================================================================

export async function FeaturedProductsSection() {
  const { heading, subheading, action, card } = FEATURED_PRODUCTS_CONFIG;

  let featuredProducts: any[] = [];
  try {
    const response = await productApi.getProducts({ page: 0, size: 8, featured: true });
    featuredProducts = (response?.content || []).map((p) => ({
      ...p,
      image: isValidImageUrl(p.imageUrl) ? p.imageUrl : '/images/placeholder.svg',
      title: p.name,
      description: p.description,
      price: p.discountPrice || p.price,
      oldPrice: p.discountPrice ? p.price : undefined,
    }));
  } catch (error: any) {
    if (isBackendDown(error)) {
      console.warn('[FeaturedProductsSection] Backend unreachable. Using curated demo products.');
    } else if (error?.status === 401 || String(error?.message || '').includes('401')) {
      console.warn('[FeaturedProductsSection] Unauthorized (401). Using curated demo products for guests.');
    } else {
      // Non-critical homepage section: fall back without surfacing a dev overlay error.
      console.warn('[FeaturedProductsSection] Failed to fetch featured products. Using demo products.', error?.message || error);
    }
  }

  // Robustness: Ensure we always have at least 4 high-quality items for a full row
  if (!featuredProducts || featuredProducts.length < 4) {
    const existingIds = new Set(featuredProducts.map(p => p.id));
    const placeholders = demoProducts
      .filter(p => !existingIds.has(p.id))
      .map(p => ({
        ...p,
        image: p.image,
        isDemo: true
      }));
    featuredProducts = [...featuredProducts, ...placeholders].slice(0, 4);
  }

  return (
    <section className="py-20 bg-white dark:bg-slate-900" aria-labelledby="featured-products-heading">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 id="featured-products-heading" className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
              {heading}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {subheading}
            </p>
          </div>

          <Button variant="outline" asChild size="lg" className="hidden md:inline-flex group border-slate-200 dark:border-slate-800">
            <Link href={action.href}>
              {action.label}
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.slice(0, 4).map((product) => (
            <Card key={product.id} className="group relative border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
              <CardContent className="p-0 flex flex-col items-start h-full">
                {/* Image Container with Cinematic Zoom */}
                <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 25vw"
                    unoptimized={product.isDemo}
                  />
                  {/* Overlay for "Clean" look */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />

                  {/* Action Bar on Hover */}
                  <div className="absolute bottom-4 left-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <AddToCartButton product={product} />
                  </div>
                </div>

                <div className="p-6 w-full flex-grow flex flex-col">
                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-[10px] ml-1 font-bold text-slate-400 uppercase tracking-widest">{card.badgeText}</span>
                  </div>

                  <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        â‚¹{product.price}
                      </span>
                      {product.oldPrice && (
                        <span className="text-xs line-through text-slate-400 font-medium">
                          â‚¹{product.oldPrice}
                        </span>
                      )}
                    </div>
                    <Link href={APP_ROUTES.PRODUCT_DETAIL(product.id.toString())} className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 uppercase tracking-wider">
                      {card.detailsLabel}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-12 md:hidden">
          <Button variant="outline" asChild className="w-full h-12 border-slate-200">
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
