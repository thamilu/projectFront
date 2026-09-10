import dynamic from 'next/dynamic';
import type { HomePageSection, SectionPriority } from '@/types/home';
import { isFeatureEnabled } from '@/core/feature-flags';
import { SECTION_PRIORITY } from '@/types/home';

// ============================================================================
// Static imports for Skeletons & Fallbacks (kept lightweight)
// ============================================================================
import {
  HeroSkeleton,
  CategorySkeleton,
  FlashDealsSkeleton,
  PromoBannerSkeleton,
  FeaturedProductsSkeleton,
  FeaturedStoresSkeleton,
  TestimonialsSkeleton,
  PromoBannersSkeleton,
  TrustSkeleton,
  AppDownloadSkeleton,
} from '../components/skeletons';

import {
  FlashDealsError,
  FeaturedProductsError,
  FeaturedStoresError,
  TestimonialsError,
  AppDownloadError,
  SectionErrorFallback,
} from '../components/error-fallbacks';

// ============================================================================
// Static Imports — Pure components with no API calls (no dynamic() needed)
// ============================================================================
// Per rendering governance: dynamic() only benefits components that need
// code-splitting. Static components add unnecessary chunk overhead.

import Hero from '../components/Hero';
import { PromoBannerSection } from '../components/PromoBannerSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import PromoBanners from '../components/PromoBanners';
import TrustSection from '../components/TrustSection';
import { AppDownloadSection } from '../components/AppDownloadSection';

// ============================================================================
// Dynamic Imports — Data-fetching components (benefit from code splitting)
// ============================================================================

const CategorySection = dynamic(
  () =>
    import('@/features/products/components/CategorySection').then((mod) => ({
      default: mod.CategorySection,
    })),
  { loading: () => <CategorySkeleton />, ssr: true }
);

const FlashDealsSection = dynamic(
  () =>
    import('@/features/products/components/FlashDealsSection').then((mod) => ({
      default: mod.FlashDealsSection,
    })),
  { loading: () => <FlashDealsSkeleton />, ssr: true }
);

const FeaturedProductsSection = dynamic(
  () =>
    import('@/features/products/components/FeaturedProductsSection').then((mod) => ({
      default: mod.FeaturedProductsSection,
    })),
  { loading: () => <FeaturedProductsSkeleton />, ssr: true }
);

// Below-the-fold data-fetching section — streamed via Suspense in HomeSection
const FeaturedStoresSection = dynamic(
  () =>
    import('@/features/seller/components/FeaturedStoresSection').then((mod) => ({
      default: mod.FeaturedStoresSection,
    })),
  { loading: () => <FeaturedStoresSkeleton />, ssr: true }
);

// ============================================================================
// Configuration Validation and Builder
// ============================================================================

/**
 * Validates and freezes homepage section configurations.
 * Throws descriptive errors for any invalid configuration.
 *
 * @param sections - Array of homepage section configurations
 * @returns Frozen (immutable) array of validated sections
 * @throws Error if any validation fails
 */
export function createSectionsConfig(sections: HomePageSection[]): readonly HomePageSection[] {
  // Validate unique IDs
  const ids = sections.map((s) => s.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

  if (duplicates.length > 0) {
    throw new Error(`[HomePageSections] Duplicate IDs found: ${duplicates.join(', ')}`);
  }

  // Validate each section's required fields
  sections.forEach((section, index) => {
    const sectionId = section.id || `<unnamed at index ${index}>`;

    // Required fields validation
    if (!section.id) {
      throw new Error(`[HomePageSections] Section at index ${index} missing required 'id' field`);
    }

    if (!section.Component) {
      throw new Error(
        `[HomePageSections] Section '${sectionId}' missing required 'Component' field`
      );
    }

    if (!section.Skeleton) {
      throw new Error(
        `[HomePageSections] Section '${sectionId}' missing required 'Skeleton' field`
      );
    }

    if (!section.ErrorFallback) {
      throw new Error(
        `[HomePageSections] Section '${sectionId}' missing required 'ErrorFallback' field`
      );
    }

    if (!section.priority) {
      throw new Error(
        `[HomePageSections] Section '${sectionId}' missing required 'priority' field`
      );
    }

    // Validate priority is one of the allowed values
    const validPriorities = Object.values(SECTION_PRIORITY);
    if (!validPriorities.includes(section.priority as any)) {
      throw new Error(
        `[HomePageSections] Section '${sectionId}' has invalid priority '${section.priority}'. ` +
          `Must be one of: ${validPriorities.join(', ')}`
      );
    }

    if (!section.ariaLabel) {
      throw new Error(
        `[HomePageSections] Section '${sectionId}' missing required 'ariaLabel' field`
      );
    }

    // Validate order is a positive number if present
    if (section.order !== undefined) {
      if (typeof section.order !== 'number' || section.order < 0) {
        throw new Error(
          `[HomePageSections] Section '${sectionId}' has invalid order '${section.order}'. ` +
            `Order must be a non-negative number.`
        );
      }
    }

    // Validate metadata if present
    if (section.metadata) {
      if (section.metadata.estimatedLoadTime !== undefined) {
        if (
          typeof section.metadata.estimatedLoadTime !== 'number' ||
          section.metadata.estimatedLoadTime < 0
        ) {
          throw new Error(
            `[HomePageSections] Section '${sectionId}' has invalid estimatedLoadTime. ` +
              `Must be a non-negative number (milliseconds).`
          );
        }
      }
    }
  });

  // Validate order uniqueness (if orders are present)
  const ordersUsed = sections
    .map((s) => s.order)
    .filter((order): order is number => order !== undefined);

  const duplicateOrders = ordersUsed.filter((order, i) => ordersUsed.indexOf(order) !== i);

  if (duplicateOrders.length > 0) {
    throw new Error(
      `[HomePageSections] Duplicate order values found: ${duplicateOrders.join(', ')}. ` +
        `Each section must have a unique order value.`
    );
  }

  return Object.freeze(sections);
}

/**
 * Homepage section configurations.
 * Governed by explicit orders and dynamic imports.
 */
export const HOME_PAGE_SECTIONS = createSectionsConfig([
  {
    id: 'hero',
    order: 10,
    Component: Hero,
    Skeleton: HeroSkeleton,
    ErrorFallback: SectionErrorFallback,
    errorFallbackProps: { section: 'hero' },
    priority: SECTION_PRIORITY.CRITICAL,
    ariaLabel: 'Hero promotional banner',
    metadata: {
      trackingId: 'home_hero',
      owner: 'marketing-team',
      estimatedLoadTime: 200,
    },
  },
  {
    id: 'categories',
    order: 20,
    Component: CategorySection,
    Skeleton: CategorySkeleton,
    ErrorFallback: SectionErrorFallback,
    errorFallbackProps: { section: 'categories' },
    priority: SECTION_PRIORITY.CRITICAL,
    ariaLabel: 'Product categories',
    metadata: {
      trackingId: 'home_categories',
      owner: 'catalog-team',
      estimatedLoadTime: 300,
    },
  },
  {
    id: 'flash-deals',
    order: 30,
    Component: FlashDealsSection,
    Skeleton: FlashDealsSkeleton,
    ErrorFallback: FlashDealsError,
    priority: SECTION_PRIORITY.HIGH,
    ariaLabel: 'Flash deals',
    metadata: {
      trackingId: 'home_flash_deals',
      abTestId: 'deals_grid_v1',
      owner: 'deals-team',
      estimatedLoadTime: 500,
    },
  },
  {
    id: 'promo-banner-1',
    order: 40,
    Component: PromoBannerSection,
    Skeleton: PromoBannerSkeleton,
    ErrorFallback: SectionErrorFallback,
    errorFallbackProps: { section: 'promotional banner' },
    priority: SECTION_PRIORITY.NORMAL,
    ariaLabel: 'Promotional banner',
    metadata: {
      trackingId: 'home_promo_banner_1',
      owner: 'marketing-team',
      estimatedLoadTime: 150,
    },
  },
  {
    id: 'featured-products',
    order: 50,
    Component: FeaturedProductsSection,
    Skeleton: FeaturedProductsSkeleton,
    ErrorFallback: FeaturedProductsError,
    priority: SECTION_PRIORITY.HIGH,
    ariaLabel: 'Featured products',
    metadata: {
      trackingId: 'home_featured_products',
      owner: 'catalog-team',
      estimatedLoadTime: 600,
    },
  },
  {
    id: 'featured-stores',
    order: 60,
    Component: FeaturedStoresSection,
    Skeleton: FeaturedStoresSkeleton,
    ErrorFallback: FeaturedStoresError,
    priority: SECTION_PRIORITY.NORMAL,
    ariaLabel: 'Featured stores',
    metadata: {
      trackingId: 'home_featured_stores',
      owner: 'seller-team',
      estimatedLoadTime: 400,
    },
  },
  {
    id: 'testimonials',
    order: 70,
    Component: TestimonialsSection,
    Skeleton: TestimonialsSkeleton,
    ErrorFallback: TestimonialsError,
    priority: SECTION_PRIORITY.LOW,
    ariaLabel: 'Customer testimonials',
    // Off by default — backed entirely by fabricated names/quotes in
    // constants/placeholders.ts. Enable only once real, sourced testimonials
    // (e.g. curated from verified reviews) replace the placeholder data —
    // see featureFlags.HOME_TESTIMONIALS's docblock.
    featureFlag: 'HOME_TESTIMONIALS',
    metadata: {
      trackingId: 'home_testimonials',
      owner: 'branding-team',
      estimatedLoadTime: 350,
    },
  },
  {
    id: 'promo-banners-2',
    order: 90,
    Component: PromoBanners,
    Skeleton: PromoBannersSkeleton,
    ErrorFallback: SectionErrorFallback,
    errorFallbackProps: { section: 'promotional banners' },
    priority: SECTION_PRIORITY.LOW,
    ariaLabel: 'Promotional banners',
    metadata: {
      trackingId: 'home_promo_banners_2',
      owner: 'marketing-team',
      estimatedLoadTime: 180,
    },
  },
  {
    id: 'trust-section',
    order: 100,
    Component: TrustSection,
    Skeleton: TrustSkeleton,
    ErrorFallback: SectionErrorFallback,
    errorFallbackProps: { section: 'trust indicators' },
    priority: SECTION_PRIORITY.LOW,
    ariaLabel: 'Trust and security indicators',
    metadata: {
      trackingId: 'home_trust',
      owner: 'security-team',
      estimatedLoadTime: 120,
    },
  },
  {
    id: 'app-download',
    order: 110,
    Component: AppDownloadSection,
    Skeleton: AppDownloadSkeleton,
    ErrorFallback: AppDownloadError,
    priority: SECTION_PRIORITY.LOW,
    ariaLabel: 'Mobile app download',
    metadata: {
      trackingId: 'home_app_download',
      owner: 'mobile-team',
      estimatedLoadTime: 220,
    },
  },
]);

// ============================================================================
// Memoized Visible Sections (computed once at module load)
// ============================================================================

/**
 * Visible sections, pre-filtered by feature flags at module load.
 * Recomputed only on deployment/restart.
 */
export const VISIBLE_SECTIONS: readonly HomePageSection[] = Object.freeze(
  HOME_PAGE_SECTIONS.filter((sectionConfig) => {
    if (!sectionConfig.featureFlag) return true;
    return isFeatureEnabled(sectionConfig.featureFlag);
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
);

/**
 * Get sections filtered by active feature flags and sorted by order.
 *
 * Performance: Memoized at module level via static VISIBLE_SECTIONS constant.
 *
 * @returns Array of visible sections based on current feature flag state
 */
export function getVisibleSections(): readonly HomePageSection[] {
  return VISIBLE_SECTIONS;
}

// ============================================================================
// Helper Functions for Common Queries
// ============================================================================

/**
 * Get section configuration by ID.
 *
 * @param id - Section ID
 * @returns Section configuration or undefined if not found
 */
export function getSectionById(id: string): HomePageSection | undefined {
  return HOME_PAGE_SECTIONS.find((section) => section.id === id);
}

/**
 * Get all sections with a specific priority level.
 *
 * @param priority - Section priority level
 * @returns Array of sections matching the priority
 */
export function getSectionsByPriority(priority: SectionPriority): readonly HomePageSection[] {
  return HOME_PAGE_SECTIONS.filter((section) => section.priority === priority);
}

/**
 * Get sections owned by a specific team.
 * Useful for team-based analytics and debugging.
 *
 * @param owner - Team name (e.g., 'marketing-team')
 * @returns Array of sections owned by the team
 */
export function getSectionsByOwner(owner: string): readonly HomePageSection[] {
  return HOME_PAGE_SECTIONS.filter((section) => section.metadata?.owner === owner);
}

/**
 * Get total estimated load time for all visible sections.
 * Useful for performance budgeting.
 *
 * @returns Total estimated load time in milliseconds
 */
export function getTotalEstimatedLoadTime(): number {
  return getVisibleSections().reduce(
    (total, section) => total + (section.metadata?.estimatedLoadTime ?? 0),
    0
  );
}

/**
 * Get sections that should be A/B tested.
 *
 * @returns Array of sections with A/B test IDs
 */
export function getABTestSections(): readonly HomePageSection[] {
  return HOME_PAGE_SECTIONS.filter((section) => section.metadata?.abTestId !== undefined);
}
