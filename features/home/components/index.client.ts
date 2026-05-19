'use client';
/**
 * Client-only exports for the Home feature.
 *
 * Export components that require client runtime (hooks, event handlers,
 * browser-only APIs) from this barrel. Import explicitly from
 * `index.client.ts` in client modules.
 */

// -----------------------------------------------------------------------------
// Section Components (client-only)
// Note: `TestimonialsSection` is a server component and is exported from
// `index.server.ts` to avoid forcing a client runtime where not required.
// -----------------------------------------------------------------------------
export { QuickLinksBanner } from './QuickLinksBanner';
export { AppDownloadSection } from './AppDownloadSection';

// -----------------------------------------------------------------------------
// Loading Skeletons
// -----------------------------------------------------------------------------
export {
	FlashDealsSkeleton,
	FeaturedProductsSkeleton,
	TestimonialsSkeleton,
	AppDownloadSkeleton,
} from './skeletons';

// -----------------------------------------------------------------------------
// Error Fallbacks
// -----------------------------------------------------------------------------
export {
	FlashDealsError,
	FeaturedProductsError,
	TestimonialsError,
	AppDownloadError,
	SectionErrorFallback,
} from './error-fallbacks';

// TODO: `QuickLinksBanner` currently has no dedicated skeleton/error fallback
// components. If the banner loads async data or can fail, consider adding
// `QuickLinksBannerSkeleton` and `QuickLinksBannerError` and re-exporting them
// from this barrel for consistency.

// Notes on tree-shaking: prefer direct imports for critical-path components
// where bundle size is a concern, e.g. `import { FlashDealsSection } from
// './FlashDealsSection'`.
