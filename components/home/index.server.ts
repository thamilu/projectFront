/**
 * Server-only exports for the Home feature.
 *
 * Export Server Components here. Import this barrel explicitly from
 * server-rendered modules to avoid pulling client components into
 * the server bundle.
 */

export { default as HomePage } from './HomePage';

import 'server-only';

// -----------------------------------------------------------------------------
// Page Components
// -----------------------------------------------------------------------------
export { CategorySection } from './CategorySection';
export { PromoBannerSection } from './PromoBannerSection';
// -----------------------------------------------------------------------------
// Section Components (server-rendered)
// -----------------------------------------------------------------------------
export { FeaturedProductsSection } from './FeaturedProductsSection';
export { TestimonialsSection } from './TestimonialsSection';
export { FlashDealsSection } from './FlashDealsSection';

// Notes:
// - These components are intended to be server components. The client-side
//   skeletons and error fallbacks live in `index.client.ts` (skeletons.tsx,
//   error-fallbacks.tsx). Avoid importing these server exports from client
//   components to prevent accidental client bundle inclusion.
