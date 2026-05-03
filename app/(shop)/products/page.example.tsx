/**
 * Products Page - Server Component
 * 
 * Enterprise patterns implemented:
 * - Server-side data fetching
 * - Parallel data loading
 * - Error boundaries
 * - Streaming with Suspense
 * - SEO optimization
 * - Type-safe API calls
 * 
 * Time Complexity: O(1) for initial load, O(n) for filtering (backend)
 * 
 * @module app/(shop)/products/page
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { z } from 'zod';
import { PageResponseSchema } from '@/lib/api/api-types';
import { typedApiClient } from '@/lib/api/api-client-v2';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductFilters } from '@/components/products/product-filters.client';
import { ProductListSkeleton } from '@/components/products/product-list-skeleton';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { logger } from '@/lib/observability/logger';

// ============================================================================
// Types & Schemas
// ============================================================================

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  discountedPrice: z.number().positive().optional(),
  imageUrl: z.string().url(),
  category: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  }),
  brand: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().nonnegative().optional(),
  inStock: z.boolean(),
  stock: z.number().nonnegative(),
  featured: z.boolean().optional(),
  createdAt: z.string().datetime(),
});



const ProductPageResponseSchema = PageResponseSchema(ProductSchema);

const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  productCount: z.number().optional(),
});

// ============================================================================
// Page Props & Search Params
// ============================================================================

interface ProductsPageProps {
  searchParams: {
    page?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
  };
}

// ============================================================================
// Metadata Generation (SEO)
// ============================================================================

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const category = searchParams.category;
  const search = searchParams.search;
  
  let title = 'Products';
  let description = 'Browse our wide selection of quality products';
  
  if (search) {
    title = `Search results for "${search}"`;
    description = `Find products matching "${search}"`;
  } else if (category) {
    title = `${category} Products`;
    description = `Shop ${category} products at great prices`;
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

// ============================================================================
// Data Fetching Functions (Server-side)
// ============================================================================

/**
 * Fetch products with pagination and filters
 * 
 * PERFORMANCE: Executed on server, cached by Next.js
 * Time Complexity: O(1) network request, O(n) backend query
 */
async function fetchProducts(searchParams: ProductsPageProps['searchParams']) {
  try {
    const page = parseInt(searchParams.page || '0', 10);
    const pageSize = 20;
    
    const response = await typedApiClient.get(
      '/products',
      ProductPageResponseSchema,
      {
        page,
        size: pageSize,
        category: searchParams.category,
        minPrice: searchParams.minPrice,
        maxPrice: searchParams.maxPrice,
        sort: searchParams.sort || 'createdAt,desc',
        search: searchParams.search,
      },
    );
    
    return response;
  } catch (error) {
    logger.error('Failed to fetch products', {
      error: { message: (error as Error).message, stack: (error as Error).stack },
      searchParams: JSON.stringify(searchParams),
    });
    throw error;
  }
}

/**
 * Fetch categories for filter sidebar
 * 
 * OPTIMIZATION: Parallel fetch with products
 */
async function fetchCategories() {
  try {
    const response = await typedApiClient.get(
      '/categories',
      z.array(CategorySchema),
      {},
    );
    
    return response;
  } catch (error) {
    logger.error('Failed to fetch categories', {
      error: { message: (error as Error).message, stack: (error as Error).stack },
    });
    // Non-critical: return empty array if categories fail
    return [];
  }
}

// ============================================================================
// Server Component
// ============================================================================

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // PERFORMANCE: Parallel data fetching
  const [productsResponse, categories] = await Promise.all([
    fetchProducts(searchParams),
    fetchCategories(),
  ]);
  
  // Handle empty results
  if (productsResponse.empty && searchParams.search) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No results found</h1>
          <p className="text-muted-foreground mb-8">
            No products match your search for &quot;{searchParams.search}&quot;
          </p>
          <a href="/products" className="text-primary hover:underline">
            View all products
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {searchParams.search
            ? `Search: "${searchParams.search}"`
            : searchParams.category
            ? `${searchParams.category} Products`
            : 'All Products'}
        </h1>
        <p className="text-muted-foreground">
          {productsResponse.totalElements.toLocaleString()} products found
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar - Client Component */}
        <aside className="lg:col-span-1">
          <ErrorBoundary fallback={<div>Filters unavailable</div>}>
            <Suspense fallback={<div>Loading filters...</div>}>
              <ProductFilters
                categories={categories}
                selectedCategory={searchParams.category}
                minPrice={searchParams.minPrice}
                maxPrice={searchParams.maxPrice}
                sort={searchParams.sort}
              />
            </Suspense>
          </ErrorBoundary>
        </aside>
        
        {/* Products Grid */}
        <main className="lg:col-span-3">
          <ErrorBoundary>
            <Suspense fallback={<ProductListSkeleton count={20} />}>
              <ProductGrid
                products={productsResponse.content}
                currentPage={productsResponse.pageNumber}
                totalPages={productsResponse.totalPages}
                totalElements={productsResponse.totalElements}
              />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

/**
 * Route segment config
 * 
 * - dynamic: Force dynamic rendering (for search/filters)
 * - revalidate: ISR revalidation period
 */
export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes
