import { cache } from 'react';
import { productsApi } from './catalog-api';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';
import { logger } from '@/core/telemetry/logger';

/**
 * Resolves a product from a /products/[slug] route param, which may be a
 * real SEO slug or (for products without one) a numeric product id.
 *
 * Wrapped in React.cache() so every server consumer within one request
 * (generateMetadata, the PDP body, the reviews page) shares one lookup
 * instead of each triggering its own round trip.
 */
export const resolveProductBySlug = cache(async (slug: string): Promise<ProductDTO | null> => {
  try {
    const product = await productsApi.getByUrl(slug);
    if (product) return product;
  } catch (error) {
    logger.warn('[resolveProductBySlug] getByUrl failed, falling back to getById', {
      component: 'domains/catalog/resolve-product',
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const productId = parseInt(slug, 10);
  if (Number.isNaN(productId)) {
    return null;
  }

  try {
    return await productsApi.getById(productId);
  } catch (error) {
    const err = error as { statusCode?: number };
    if (err?.statusCode === 404) {
      return null;
    }
    // Distinguish "genuinely not found" from a real backend/network failure
    // so the latter doesn't silently render as a 404.
    logger.error('[resolveProductBySlug] getById failed', {
      component: 'domains/catalog/resolve-product',
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
});
