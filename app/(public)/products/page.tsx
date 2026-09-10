/**
 * Products Listing Page — Server Component
 *
 * Architectural contract (rendering-governance.md, SERVER_COMPONENT_RULES.md):
 * - Server Component by default; NO 'use client'.
 * - All data fetched server-side in parallel via Promise.all before first paint.
 * - Interactive client island is pushed to the leaf: ProductsListClient.
 * - Wraps client island in Suspense with a structured skeleton fallback.
 *
 * Performance impact:
 * BEFORE: browser downloads JS → hydrates → fires 3 API calls → renders content (slow)
 * AFTER:  server fetches data → streams pre-populated HTML → client hydrates (instant)
 *
 * @module app/(public)/products/page
 */

import { Suspense } from 'react';
import { type Metadata } from 'next';
import { productsApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import { isBackendAvailable } from '@/core/client/backend-health';
import ProductsListClient from './products-list-client';
import { ProductGridSkeleton } from './products-list-client';
import { siteConfig } from '@/core/config/site';
import SafeJsonLd from '@/shared/ui/layout/Seo/SafeJsonLd';
import { type PageRequest } from '@/shared/types';
import { type ProductFilters, type ProductDTO } from '@/domains/catalog/contracts/catalog.types';

// ISR: revalidate every 60 s so the product list stays reasonably fresh
// without forcing a full SSR on every request.
export const revalidate = 60;

export const metadata: Metadata = {
  // Title only — the surrounding layout's `title.template` appends the
  // site/section suffix. Hardcoding it here produced a doubled tab title
  // ("Products | eShop | eShop") and a doubled og:title.
  title: 'Products',
  description:
    'Browse our wide selection of products. Find the best deals on quality items from top brands.',
  keywords: ['products', 'shop', 'buy online', 'e-commerce'],
  alternates: { canonical: new URL('/products', siteConfig.url).toString() },
};

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    brand?: string;
  }>;
}

const PAGE_SIZE = siteConfig.pagination?.defaultPageSize ?? 12;

/**
 * Server Component — orchestrates SSR data fetching and Suspense hydration boundary.
 * Must stay under 60 lines of JSX logic per page governance rules.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = params.page ? Math.max(0, Number(params.page)) : 0;
  const categoryId = params.category ? Number(params.category) : undefined;
  const brandId = params.brand ? Number(params.brand) : undefined;
  const search = params.q?.trim() || undefined;

  const queryParams: PageRequest & ProductFilters = {
    page,
    size: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
  };

  // Parallel server-side fetch — skip API calls when backend is unavailable
  const backendUp = await isBackendAvailable();

  const [productsResult, categoriesResult, brandsResult] = backendUp
    ? await Promise.allSettled([
        productsApi.getAll(queryParams),
        productsApi.getCategoryTree(),
        productsApi.getBrands(),
      ])
    : [
        { status: 'rejected' as const, reason: new Error('Backend unavailable') },
        { status: 'rejected' as const, reason: new Error('Backend unavailable') },
        { status: 'rejected' as const, reason: new Error('Backend unavailable') },
      ];

  // Empty fallback shape used only for the server-rendered JSON-LD below
  // (which just needs *some* PageResponse to read totals/content from);
  // the client component gets `undefined` on failure instead (see its
  // initialProducts prop) so it performs a real client-side fetch and
  // surfaces a genuine error state rather than silently showing "no
  // products found" for what was actually a backend outage.
  const products =
    productsResult.status === 'fulfilled'
      ? productsResult.value
      : {
          content: [] as ProductDTO[],
          totalElements: 0,
          totalPages: 0,
          size: PAGE_SIZE,
          number: 0,
          first: true,
          last: true,
        };

  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const brands = brandsResult.status === 'fulfilled' ? brandsResult.value : [];

  // JSON-LD structured data for SEO (server-rendered, zero JS cost)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Products',
    description: 'Browse our wide selection of products',
    url: new URL('/products', siteConfig.url).toString(),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.totalElements,
      itemListElement: products.content.slice(0, 20).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: new URL(
            `/products/${product.urlSlug ?? product.id}`,
            siteConfig.url
          ).toString(),
          image: product.images?.[0]?.url ?? product.imageUrl ?? null,
          offers: {
            '@type': 'Offer',
            price: product.discountPrice ?? product.price,
            priceCurrency: 'INR',
          },
        },
      })),
    },
  };

  return (
    <>
      <SafeJsonLd data={jsonLd} />

      {/*
       * Suspense boundary: ProductsListClient is the sole 'use client' island.
       * The skeleton renders instantly (server HTML) while the client hydrates.
       */}
      <Suspense fallback={<ProductGridSkeleton count={PAGE_SIZE} />}>
        <ProductsListClient
          initialProducts={productsResult.status === 'fulfilled' ? productsResult.value : undefined}
          categories={categories}
          brands={brands}
          initialSearchParams={{
            page: params.page,
            q: params.q,
            category: params.category,
            brand: params.brand,
          }}
        />
      </Suspense>
    </>
  );
}
