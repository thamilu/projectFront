/**
 * Products Listing Page
 *
 * Enterprise-grade product listing with:
 * - URL-synced filters (shareable, bookmarkable, back-button friendly)
 * - Debounced search (configurable) - no API call on every keystroke
 * - Smooth loading states (no full skeleton flash)
 * - Responsive: sticky sidebar (desktop) + drawer (mobile)
 * - Type-safe with Zod validation
 * - CSS modules for security (no dangerouslySetInnerHTML)
 * - next/image for performance
 * - Config-driven pagination and debounce settings
 * - Explicit error state handling
 *
 * @module app/products/page
 */

'use client';

import { useState, useMemo, useTransition, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { z } from 'zod';
import { useDebounce } from '@/hooks';
import { useProducts, useCategories, useBrands } from '@/features/products/hooks/use-products';
import { useCart } from '@/features/cart/hooks/use-cart';
import { formatPrice, calculateDiscount, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/lib/config';
import {
  ProductSummarySchema,
  CategorySchema,
  BrandSchema,
  ProductListResponseSchema,
} from '@/lib/validation/schemas/api-response';
import { logger } from '@/lib/observability/logger';
import {
  Search,
  ShoppingCart,
  Star,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import styles from './products.module.css';

const PAGE_SIZE = siteConfig.pagination?.defaultPageSize ?? 12;
const SEARCH_DEBOUNCE_MS = siteConfig.pagination?.searchDebounceMs ?? 300;

function readUrlState(params: URLSearchParams): {
  search: string;
  categoryId: number | undefined;
  brandId: number | undefined;
  page: number;
} {
  return {
    search: params.get('q') ?? '',
    categoryId: params.get('category') ? Number(params.get('category')) : undefined,
    brandId: params.get('brand') ? Number(params.get('brand')) : undefined,
    page: params.get('page') ? Number(params.get('page')) : 0,
  };
}

function buildUrlParams(
  patch: Record<string, string | number | undefined>,
  current: URLSearchParams
): string {
  const next = new URLSearchParams(current.toString());
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 0) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  });
  return next.toString();
}

function getStockLabel(qty: number): { label: string; cls: string } {
  if (qty === 0) return { label: 'Out of Stock', cls: 'text-destructive' };
  if (qty <= 10) return { label: 'Low Stock', cls: 'text-orange-500' };
  return { label: 'In Stock', cls: 'text-emerald-600' };
}

function parseProductsResponse(response: unknown) {
  const parsed = ProductListResponseSchema.safeParse(response);
  if (!parsed.success) {
    logger.warn('[Products] Invalid products response', { issues: parsed.error.issues });
    return { products: [], totalElements: 0, totalPages: 0 };
  }

  const data = parsed.data;
  if (Array.isArray(data)) {
    return { products: data, totalElements: data.length, totalPages: 1 };
  }

  if ('data' in data && data.data && typeof data.data === 'object') {
    const content = (data.data as { content?: unknown })?.content;
    const totalElements = (data.data as { totalElements?: number })?.totalElements;
    const totalPages = (data.data as { totalPages?: number })?.totalPages;
    return {
      products: Array.isArray(content) ? content : [],
      totalElements: totalElements ?? 0,
      totalPages: totalPages ?? 0,
    };
  }

  if ('content' in data && typeof data === 'object') {
    const content = (data as { content?: unknown })?.content;
    const totalElements = (data as { totalElements?: number })?.totalElements;
    const totalPages = (data as { totalPages?: number })?.totalPages;
    return {
      products: Array.isArray(content) ? content : [],
      totalElements: totalElements ?? 0,
      totalPages: totalPages ?? 0,
    };
  }

  return { products: [], totalElements: 0, totalPages: 0 };
}

function parseCategoriesResponse(response: unknown) {
  const parsed = z.array(CategorySchema).safeParse(response);
  if (!parsed.success) {
    logger.warn('[Products] Invalid categories response', { issues: parsed.error.issues });
    return [];
  }
  return parsed.data;
}

function parseBrandsResponse(response: unknown) {
  const parsed = z.array(BrandSchema).safeParse(response);
  if (!parsed.success) {
    logger.warn('[Products] Invalid brands response', { issues: parsed.error.issues });
    return [];
  }
  return parsed.data;
}

function ProductGridSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: PAGE_SIZE }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
  isAdding,
}: {
  product: z.infer<typeof ProductSummarySchema>;
  onAddToCart: (id: number) => void;
  isAdding: boolean;
}) {
  const discount = product.discountPrice
    ? calculateDiscount(product.price, product.discountPrice)
    : null;
  const displayPrice = product.discountPrice || product.price;
  const stock = getStockLabel(product.stockQuantity ?? 0);
  const outOfStock = product.stockQuantity === 0;

  return (
    <article className={styles.card}>
      {discount && <span className={styles.badge}>{discount}% OFF</span>}

      <Link href={`/products/${product.id}`} className={styles.imageWrap} tabIndex={-1}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Package className="text-muted-foreground/40 h-10 w-10" />
          </div>
        )}
        <div className={styles.overlay} aria-hidden="true">
          <span className={styles.overlayLabel}>Quick View</span>
        </div>
      </Link>

      <div className={styles.info}>
        {product.brand && <p className={styles.brand}>{product.brand.name}</p>}
        <Link href={`/products/${product.id}`}>
          <h2 className={styles.name}>{product.name}</h2>
        </Link>
        {product.rating && (
          <div className={styles.rating}>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount && <span className="opacity-50">({product.reviewCount})</span>}
          </div>
        )}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(displayPrice)}</span>
          {product.discountPrice && (
            <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
          )}
        </div>
        <p className={cn(styles.stock, stock.cls)}>{stock.label}</p>
        <Button
          className={styles.cartBtn}
          onClick={() => onAddToCart(product.id)}
          disabled={outOfStock || isAdding}
          size="sm"
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
          {outOfStock ? 'Unavailable' : 'Add to Cart'}
        </Button>
      </div>
    </article>
  );
}

function FilterPanel({
  categoryId,
  brandId,
  categories,
  brands,
  onCategoryChange,
  onBrandChange,
  onClearAll,
  onClose,
}: {
  categoryId: number | undefined;
  brandId: number | undefined;
  categories: z.infer<typeof CategorySchema>[];
  brands: z.infer<typeof BrandSchema>[];
  onCategoryChange: (id: number | undefined) => void;
  onBrandChange: (id: number | undefined) => void;
  onClearAll: () => void;
  onClose?: () => void;
}) {
  const isDirty = categoryId !== undefined || brandId !== undefined;
  return (
    <aside className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <h2 className={styles.filterTitle}>Filters</h2>
        <div className={styles.filterActions}>
          {isDirty && (
            <button onClick={onClearAll} className={styles.clearBtn}>
              Clear all
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className={styles.closeBtn} aria-label="Close filters">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>Category</p>
        <div className={styles.filterOptions}>
          <button
            onClick={() => onCategoryChange(undefined)}
            className={cn(styles.filterOption, !categoryId && styles.active)}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(styles.filterOption, categoryId === cat.id && styles.active)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>Brand</p>
          <div className={styles.filterOptions}>
            <button
              onClick={() => onBrandChange(undefined)}
              className={cn(styles.filterOption, !brandId && styles.active)}
            >
              All Brands
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => onBrandChange(brand.id)}
                className={cn(styles.filterOption, brandId === brand.id && styles.active)}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Product pages">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className={styles.pageBtn}
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(styles.pageBtn, p === page && styles.active)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p + 1}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={styles.pageBtn}
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname() ?? '/products';
  const rawParams = useSearchParams();
  const searchParams = useMemo(() => rawParams ?? new URLSearchParams(), [rawParams]);
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { search, categoryId, brandId, page } = readUrlState(searchParams);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const pushUrl = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      startTransition(() => {
        const qs = buildUrlParams(patch, searchParams);
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const prevDebounced = useRef(debouncedSearch);
  useEffect(() => {
    if (debouncedSearch !== prevDebounced.current) {
      prevDebounced.current = debouncedSearch;
      pushUrl({ q: debouncedSearch || undefined, page: undefined });
    }
  }, [debouncedSearch, pushUrl]);

  const {
    data: productsData,
    isLoading,
    error: productsError,
  } = useProducts({
    page,
    size: PAGE_SIZE,
    search,
    categoryId,
    brandId,
  });

  const { data: categoriesData, error: categoriesError } = useCategories();
  const { data: brandsData, error: brandsError } = useBrands();
  const { addToCart, isAdding } = useCart();

  const validatedProducts = useMemo(() => {
    if (!productsData) return [];
    const { products } = parseProductsResponse(productsData);
    return products.map((p) => ProductSummarySchema.parse(p));
  }, [productsData]);

  const validatedCategories = useMemo(() => {
    if (!categoriesData) return [];
    return parseCategoriesResponse(categoriesData);
  }, [categoriesData]);

  const validatedBrands = useMemo(() => {
    if (!brandsData) return [];
    return parseBrandsResponse(brandsData);
  }, [brandsData]);

  const { totalElements, totalPages } = useMemo(() => {
    if (!productsData) return { totalElements: 0, totalPages: 0 };
    return parseProductsResponse(productsData);
  }, [productsData]);

  const hasError = productsError || categoriesError || brandsError;
  const errorMessage = productsError?.message || categoriesError?.message || brandsError?.message;

  const activeFilterCount = [categoryId, brandId].filter(Boolean).length;

  const handleAddToCart = useCallback(
    (productId: number) => {
      addToCart({ productId, quantity: 1 });
    },
    [addToCart]
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0f1e]">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {hasError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || 'Failed to load products. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">All Products</h1>
          {!isLoading && totalElements > 0 && (
            <p className="text-muted-foreground mt-1 text-sm">
              {totalElements.toLocaleString()} products
              {search && (
                <>
                  {' '}
                  for <strong>&quot;{search}&quot;</strong>
                </>
              )}
              {categoryId && validatedCategories.find((c) => c.id === categoryId) && (
                <>
                  {' '}
                  in <strong>{validatedCategories.find((c) => c.id === categoryId)?.name}</strong>
                </>
              )}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <div className="relative max-w-xl flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search products, brands…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-11 rounded-xl pl-10"
              />
              {isPending && (
                <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>

            <Button
              variant="outline"
              className="h-11 gap-2 rounded-xl lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="sticky top-24 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto lg:block">
            <FilterPanel
              categoryId={categoryId}
              brandId={brandId}
              categories={validatedCategories}
              brands={validatedBrands}
              onCategoryChange={(id) => pushUrl({ category: id, page: undefined })}
              onBrandChange={(id) => pushUrl({ brand: id, page: undefined })}
              onClearAll={() => pushUrl({ category: undefined, brand: undefined, page: undefined })}
            />
          </div>

          {drawerOpen && (
            <>
              <div
                className={styles.drawerBackdrop}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Filters">
                <FilterPanel
                  categoryId={categoryId}
                  brandId={brandId}
                  categories={validatedCategories}
                  brands={validatedBrands}
                  onCategoryChange={(id) => {
                    pushUrl({ category: id, page: undefined });
                    setDrawerOpen(false);
                  }}
                  onBrandChange={(id) => {
                    pushUrl({ brand: id, page: undefined });
                    setDrawerOpen(false);
                  }}
                  onClearAll={() => {
                    pushUrl({
                      category: undefined,
                      brand: undefined,
                      page: undefined,
                    });
                    setDrawerOpen(false);
                  }}
                  onClose={() => setDrawerOpen(false)}
                />
              </div>
            </>
          )}

          <div className="min-w-0 flex-1">
            {isLoading && validatedProducts.length === 0 ? (
              <ProductGridSkeleton />
            ) : validatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Package className="text-muted-foreground/30 mb-4 h-16 w-16" />
                <h2 className="text-lg font-semibold">No products found</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Try adjusting your search or filters.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput('');
                    pushUrl({
                      q: undefined,
                      category: undefined,
                      brand: undefined,
                      page: undefined,
                    });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={styles.gridWrap}>
                {(isLoading || isPending) && (
                  <div
                    className={styles.loadingOverlay}
                    aria-live="polite"
                    aria-label="Updating products…"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                )}
                <div
                  className={cn(
                    styles.grid,
                    'transition-opacity duration-200',
                    isPending || isLoading ? 'opacity-50' : 'opacity-100'
                  )}
                >
                  {validatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      isAdding={isAdding}
                    />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(p) => pushUrl({ page: p || undefined })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
