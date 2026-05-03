import React from 'react';
import Hero from './Hero';
import { CategorySection } from './CategorySection';
import { FlashDealsSection } from './FlashDealsSection';
import { PromoBannerSection } from './PromoBannerSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { FeaturedStoresSection } from './FeaturedStoresSection';
import FeaturedSlider from './FeaturedSlider';
import PromoBanners from './PromoBanners';
import TrustSection from './TrustSection';
import { TestimonialsSection } from './TestimonialsSection';
import { AppDownloadSection } from './AppDownloadSection';
import { siteConfig } from '@/lib/config/site';
import {
  FlashDealsSkeleton,
  FeaturedProductsSkeleton,
  FeaturedStoresSkeleton,
  TestimonialsSkeleton,
  AppDownloadSkeleton,
  HeroSkeleton,
  CategorySkeleton,
  PromoBannerSkeleton,
  FeaturedSliderSkeleton,
  PromoBannersSkeleton,
  TrustSkeleton,
} from './skeletons';
import {
  FlashDealsError,
  FeaturedProductsError,
  FeaturedStoresError,
  TestimonialsError,
  AppDownloadError,
  SectionErrorFallback,
} from './error-fallbacks';
import { ResilientSection } from '@/components/common/resilient-section';
import { SectionReveal } from './SectionReveal';

/**
 * Enterprise Home Page Component
 *
 * Architecture Notes:
 * - Server Component with streaming SSR for optimal Core Web Vitals
 * - ResilientSection provides error boundaries + Suspense for each section
 * - Async Server Components trigger Suspense boundaries during data fetching
 * - No manual dynamic() imports—rely on natural code splitting + Suspense
 * - Header should be in app/layout.tsx for persistent state across routes
 *
 * Performance Strategy:
 * - Above-fold sections: Render immediately (Hero, QuickLinks, Categories)
 * - Data-driven sections: Stream progressively (Flash Deals, Featured Products)
 * - Below-fold sections: Load naturally with Suspense (no ssr: false)
 *
 * @example
 * ```tsx
 * // In app/page.tsx:
 * import HomePage from '@/components/home/HomePage';
 * export default function Page() {
 *   return <HomePage />;
 * }
 * ```
 */
// Define the layout configuration to keep the UI strictly DRY and scalable
// This approach easily scales into a backend-driven CMS layout in the future.
const HOME_PAGE_SECTIONS = [
  {
    id: 'hero',
    Component: Hero,
    Skeleton: HeroSkeleton,
    Fallback: <SectionErrorFallback section="hero" />,
  },
  {
    id: 'categories',
    Component: CategorySection,
    Skeleton: CategorySkeleton,
    Fallback: <SectionErrorFallback section="categories" />,
  },
  {
    id: 'flash-deals',
    Component: FlashDealsSection,
    Skeleton: FlashDealsSkeleton,
    Fallback: <FlashDealsError />,
  },
  {
    id: 'promo-banner-1',
    Component: PromoBannerSection,
    Skeleton: PromoBannerSkeleton,
    Fallback: <SectionErrorFallback section="promotional banner" />,
  },
  {
    id: 'featured-products',
    Component: FeaturedProductsSection,
    Skeleton: FeaturedProductsSkeleton,
    Fallback: <FeaturedProductsError />,
  },
  {
    id: 'featured-stores',
    Component: FeaturedStoresSection,
    Skeleton: FeaturedStoresSkeleton,
    Fallback: <FeaturedStoresError />,
  },
  {
    id: 'testimonials',
    Component: TestimonialsSection,
    Skeleton: TestimonialsSkeleton,
    Fallback: <TestimonialsError />,
  },
  {
    id: 'featured-slider',
    Component: FeaturedSlider,
    Skeleton: FeaturedSliderSkeleton,
    Fallback: <SectionErrorFallback section="featured slider" />,
  },
  {
    id: 'promo-banners-2',
    Component: PromoBanners,
    Skeleton: PromoBannersSkeleton,
    Fallback: <SectionErrorFallback section="promo banners" />,
  },
  {
    id: 'trust-section',
    Component: TrustSection,
    Skeleton: TrustSkeleton,
    Fallback: <SectionErrorFallback section="trust" />,
  },
  {
    id: 'app-download',
    Component: AppDownloadSection,
    Skeleton: AppDownloadSkeleton,
    Fallback: <AppDownloadError />,
  },
];

export default function HomePage(): React.JSX.Element {
  return (
    <main id="main-content" aria-label="Home page content" className="min-h-dvh">
      {/* Skip navigation for keyboard/screen reader users (WCAG 2.1) */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:outline-none"
      >
        Skip to main content
      </a>

      {/* SEO: Primary heading for document outline */}
      <h1 className="sr-only">{siteConfig.name}</h1>

      {/* Live region for dynamic content announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="loading-announcer"
      />

      {/* 
        Render all sections dynamically leveraging the configuration array.
        Each section is still safely wrapped in boundaries.
      */}
      {HOME_PAGE_SECTIONS.map((section, index) => (
        <SectionReveal key={section.id} index={index}>
          <ResilientSection fallback={section.Fallback} skeleton={<section.Skeleton />}>
            <section.Component />
          </ResilientSection>
        </SectionReveal>
      ))}
    </main>
  );
}
