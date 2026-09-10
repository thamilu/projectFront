import { BannerCarousel } from './BannerCarousel';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// BannerCarousel moved to its own client component file

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Enterprise Hero Section - Flipkart/Amazon Style High Density
 *
 * Features:
 * - Native CSS snap-scrolling carousel for high-performance banners
 * - Dense grid of quick-navigation category icons
 * - Optimized for mobile touch interfaces and desktop viewing
 */
export default async function Hero() {
  return (
    <section className="bg-background pt-4 pb-8" aria-label="Promotional Offers">
      <BannerCarousel />
    </section>
  );
}
