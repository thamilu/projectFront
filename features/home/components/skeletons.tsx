import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { cn } from '@/shared/utils';

// Counts / constants to avoid recreating arrays on render
const FLASH_DEALS_COUNT = 4;
const FEATURED_PRODUCTS_COUNT_MOBILE = 4;
const FEATURED_PRODUCTS_COUNT_DESKTOP = 8;
const FEATURED_STORES_COUNT = 5;
const TESTIMONIALS_COUNT = 3;
const STAR_RATING_COUNT = 5;
const SLIDER_ITEMS_COUNT = 5;

// Pre-generate stable array indices to avoid recreation on every render
const INDICES = {
  flashDeals: Array.from({ length: FLASH_DEALS_COUNT }, (_, i) => i),
  featuredMobile: Array.from({ length: FEATURED_PRODUCTS_COUNT_MOBILE }, (_, i) => i),
  featuredDesktop: Array.from(
    { length: FEATURED_PRODUCTS_COUNT_DESKTOP - FEATURED_PRODUCTS_COUNT_MOBILE },
    (_, i) => i + FEATURED_PRODUCTS_COUNT_MOBILE
  ),
  stores: Array.from({ length: FEATURED_STORES_COUNT }, (_, i) => i),
  testimonials: Array.from({ length: TESTIMONIALS_COUNT }, (_, i) => i),
  stars: Array.from({ length: STAR_RATING_COUNT }, (_, i) => i),
  slider: Array.from({ length: SLIDER_ITEMS_COUNT }, (_, i) => i),
} as const;

function SkeletonSection({ children, label, className, announce = true }: { children: React.ReactNode; label: string; className?: string; announce?: boolean }) {
  return (
    <section 
      className={cn("motion-reduce:[&_*]:animate-none", className)} 
      aria-busy="true" 
      aria-label={`Loading ${label}`} 
      {...(announce && { role: "status" })}
    >
      {announce && <span className="sr-only">Loading {label}...</span>}
      {children}
    </section>
  );
}

function ProductCardSkeleton({ imageHeight = "aspect-[4/5]" }: { imageHeight?: string }) {
  return (
    <div className="space-y-3">
      <Skeleton className={cn(imageHeight, "w-full rounded-lg")} />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function FlashDealsSkeleton() {
  return (
    <SkeletonSection label="flash deals" className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {INDICES.flashDeals.map((i) => (
          <ProductCardSkeleton key={i} imageHeight="aspect-square" />
        ))}
      </div>
    </SkeletonSection>
  );
}

export function FeaturedProductsSkeleton() {
  return (
    <SkeletonSection label="featured products" className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <Skeleton className="h-10 w-64 mx-auto mb-3" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {INDICES.featuredMobile.map((i) => (
          <ProductCardSkeleton key={i} imageHeight="aspect-[4/5]" />
        ))}

        {/* Desktop-only additional items to match larger layout without overloading mobile */}
        {INDICES.featuredDesktop.map((i) => (
          <div key={i} className="hidden sm:block">
            <ProductCardSkeleton imageHeight="aspect-[4/5]" />
          </div>
        ))}
      </div>
    </SkeletonSection>
  );
}

export function FeaturedStoresSkeleton() {
  return (
    <SkeletonSection label="featured stores" className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-8 w-24 hidden md:block" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {INDICES.stores.map((i) => (
          <div key={i} className="flex-shrink-0 w-44 space-y-3 rounded-2xl border border-border p-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonSection>
  );
}

export function TestimonialsSkeleton() {
  return (
    <SkeletonSection label="testimonials" className="container mx-auto px-4 py-12 bg-muted" announce={false}>
      <div className="mb-8 text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-3" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {INDICES.testimonials.map((i) => (
          <div key={i} className="space-y-4 p-6 bg-card rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-1">
              {INDICES.stars.map((j) => (
                <Skeleton key={j} className="h-4 w-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkeletonSection>
  );
}

export function AppDownloadSkeleton() {
  return (
    <SkeletonSection label="app download" className="container mx-auto px-4 py-16" announce={false}>
      <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-64 bg-white/20" />
          <Skeleton className="h-4 w-full bg-white/20" />
          <Skeleton className="h-4 w-3/4 bg-white/20" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-40 bg-white/20 rounded-lg" />
            <Skeleton className="h-12 w-40 bg-white/20 rounded-lg" />
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="aspect-video w-full bg-white/20 rounded-lg" />
        </div>
      </div>
    </SkeletonSection>
  );
}

export function HeroSkeleton() {
  return (
    <SkeletonSection label="hero" className="w-full" announce={false}>
      <div className="relative h-[320px] sm:h-[420px] md:h-[520px] bg-gradient-to-br from-primary to-secondary text-white">
        <div className="absolute inset-0 bg-white/5"></div>
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center">
          <div className="max-w-2xl">
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4 bg-white/20 rounded" />
              <Skeleton className="h-4 w-full bg-white/10 rounded" />
              <Skeleton className="h-6 w-1/3 bg-white/10 rounded mt-6" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonSection>
  );
}

export function CategorySkeleton() {
  return (
    <SkeletonSection label="categories" className="container mx-auto px-4 py-16" announce={false}>
      <Skeleton className="h-48 w-full rounded-lg" />
    </SkeletonSection>
  );
}

export function PromoBannerSkeleton() {
  return (
    <SkeletonSection label="promo banner" className="container mx-auto px-4 py-8" announce={false}>
      <Skeleton className="h-64 w-full rounded-lg" />
    </SkeletonSection>
  );
}

export function QuickLinksSkeleton() {
  return (
    <SkeletonSection label="quick links" className="container mx-auto px-4" announce={false}>
      <Skeleton className="h-16 w-full rounded" />
    </SkeletonSection>
  );
}

export function FeaturedSliderSkeleton() {
  return (
    <SkeletonSection label="featured slider" className="container mx-auto px-4 py-8" announce={false}>
      <Skeleton className="h-8 w-48 rounded mb-6" />
      <div className="flex gap-4 overflow-hidden">
        {INDICES.slider.map((i) => (
          <Skeleton key={i} className="flex-shrink-0 w-48 sm:w-64 h-56 sm:h-80 rounded-lg" />
        ))}
      </div>
    </SkeletonSection>
  );
}

export function PromoBannersSkeleton() {
  return (
    <SkeletonSection label="promo banners" className="container mx-auto px-4 py-8" announce={false}>
      <Skeleton className="h-44 w-full rounded-lg" />
    </SkeletonSection>
  );
}

export function TrustSkeleton() {
  return (
    <SkeletonSection label="trust" className="container mx-auto px-4 py-6" announce={false}>
      <Skeleton className="h-32 w-full rounded-lg" />
    </SkeletonSection>
  );
}
