'use client';

/**
 * ProductsListClient — Interactive Client Island
 *
 * Responsibilities:
 * - Renders the initial SSR-hydrated product grid with no layout shift.
 * - Handles URL-synced filter state (category, brand, search, page).
 * - On filter/search change: refetches via TanStack Query and shows an
 *   overlay spinner while keeping the stale grid visible (no full-skeleton flash).
 * - Debounces search input to avoid per-keystroke API calls.
 *
 * What this does NOT do:
 * - No data fetching on first render (initialProducts from Server Component).
 * - No business logic — pure UI orchestration via hooks.
 *
 * @module app/(public)/products/products-list-client
 */

import { useState, useCallback, useTransition, useMemo, useEffect, useRef, memo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/atoms/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/atoms/select';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useDebounce } from '@/shared/hooks';
import { formatPrice, calculateDiscount, cn } from '@/shared/utils';
import { productsApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import { productKeys } from '@/features/products/query-keys';
import { siteConfig } from '@/core/config';
import { type PageResponse, type PageRequest } from '@/shared/types';
import {
  type ProductDTO,
  type CategoryDTO,
  type BrandDTO,
  type ProductFilters,
} from '@/domains/catalog/contracts/catalog.types';
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
  Grid,
  List,
} from 'lucide-react';
import styles from './products.module.css';
import { APP_ROUTES } from '@/shared/routes';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = siteConfig.pagination?.defaultPageSize ?? 12;
const SEARCH_DEBOUNCE_MS = siteConfig.pagination?.searchDebounceMs ?? 300;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductsListClientProps {
  // Omitted (rather than an empty PageResponse) when the server-side fetch
  // failed — this makes React Query treat the initial mount as needing a
  // real fetch instead of pre-seeding "success, zero results," which
  // previously made a genuine backend outage render identically to an
  // empty catalog with no error signal anywhere.
  initialProducts: PageResponse<ProductDTO> | undefined;
  categories: CategoryDTO[];
  brands: BrandDTO[];
  initialSearchParams: {
    page?: string;
    q?: string;
    category?: string;
    brand?: string;
  };
}

// ─── Skeleton (exported for Suspense fallback in Server Component) ─────────────

export function ProductGridSkeleton({ count = PAGE_SIZE }: { count?: number }) {
  return (
    <div className={styles.grid} aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockLabel({ qty }: { qty: number }) {
  if (qty === 0) return <span className="text-destructive text-xs">Out of Stock</span>;
  if (qty <= 10) return <span className="text-xs text-orange-500">Low Stock</span>;
  return <span className="text-xs text-emerald-600">In Stock</span>;
}

/** Runtime shape returned by the backend that extends the contract type. */
type ProductWithExtras = ProductDTO & {
  urlSlug?: string;
  rating?: number;
  reviewCount?: number;
};

const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  isAdding,
}: {
  product: ProductDTO;
  onAddToCart: (id: number) => void;
  isAdding: boolean;
}) {
  const p = product as ProductWithExtras;
  const discount = p.discountPrice ? calculateDiscount(p.price, p.discountPrice) : null;
  const displayPrice = p.discountPrice ?? p.price;
  const outOfStock = p.stockQuantity === 0;
  const slug = p.urlSlug ?? p.id;
  const images = p.images ?? (p.imageUrl ? [{ url: p.imageUrl }] : []);

  return (
    <article className={styles.card}>
      {discount && <span className={styles.badge}>{discount}% OFF</span>}

      <Link
        href={`/products/${slug}`}
        className={styles.imageWrap}
        tabIndex={-1}
        aria-label={p.name}
      >
        {images[0] ? (
          <Image
            src={images[0].url}
            alt={p.name}
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
        {p.brand && <p className={styles.brand}>{p.brand.name}</p>}
        <Link href={`/products/${slug}`}>
          <h2 className={styles.name}>{p.name}</h2>
        </Link>
        {p.rating != null && (
          <div className={styles.rating}>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span>{p.rating.toFixed(1)}</span>
            {p.reviewCount != null && <span className="opacity-50">({p.reviewCount})</span>}
          </div>
        )}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(displayPrice)}</span>
          {p.discountPrice && <span className={styles.originalPrice}>{formatPrice(p.price)}</span>}
        </div>
        <StockLabel qty={p.stockQuantity ?? 0} />
        <Button
          className={styles.cartBtn}
          onClick={() => onAddToCart(p.id)}
          disabled={outOfStock || isAdding}
          size="sm"
          aria-label={outOfStock ? `${p.name} is unavailable` : `Add ${p.name} to cart`}
          data-testid={`add-to-cart-${p.id}`}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {outOfStock ? 'Unavailable' : 'Add to Cart'}
        </Button>
      </div>
    </article>
  );
});
ProductCard.displayName = 'ProductCard';

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
  categories: CategoryDTO[];
  brands: BrandDTO[];
  onCategoryChange: (id: number | undefined) => void;
  onBrandChange: (id: number | undefined) => void;
  onClearAll: () => void;
  onClose?: () => void;
}) {
  const isDirty = categoryId !== undefined || brandId !== undefined;
  return (
    <aside className={styles.filterPanel} aria-label="Product filters">
      <div className={styles.filterHeader}>
        <h2 className={styles.filterTitle}>Filters</h2>
        <div className={styles.filterActions}>
          {isDirty && (
            <button onClick={onClearAll} className={styles.clearBtn} data-testid="clear-filters">
              Clear all
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className={styles.closeBtn} aria-label="Close filters">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <p className={styles.filterLabel} id="category-filter-label">
          Category
        </p>
        <div className={styles.filterOptions} role="group" aria-labelledby="category-filter-label">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={cn(styles.filterOption, !categoryId && styles.active)}
            aria-pressed={!categoryId}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(styles.filterOption, categoryId === cat.id && styles.active)}
              aria-pressed={categoryId === cat.id}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel} id="brand-filter-label">
            Brand
          </p>
          <div className={styles.filterOptions} role="group" aria-labelledby="brand-filter-label">
            <button
              onClick={() => onBrandChange(undefined)}
              className={cn(styles.filterOption, !brandId && styles.active)}
              aria-pressed={!brandId}
            >
              All Brands
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => onBrandChange(brand.id)}
                className={cn(styles.filterOption, brandId === brand.id && styles.active)}
                aria-pressed={brandId === brand.id}
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
        aria-label="Previous page"
        data-testid="pagination-prev"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(styles.pageBtn, p === page && styles.active)}
          aria-current={p === page ? 'page' : undefined}
          data-testid={`pagination-page-${p + 1}`}
        >
          {p + 1}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className={styles.pageBtn}
        aria-label="Next page"
        data-testid="pagination-next"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

// ─── URL State helpers ─────────────────────────────────────────────────────────

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

// ─── Main Client Island ────────────────────────────────────────────────────────

export default function ProductsListClient({
  initialProducts,
  categories,
  brands,
  initialSearchParams: _initialSearchParams,
}: ProductsListClientProps) {
  const router = useRouter();
  const pathname = usePathname() ?? APP_ROUTES.PRODUCTS;
  const rawParams = useSearchParams();
  const searchParams = useMemo(() => rawParams ?? new URLSearchParams(), [rawParams]);
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Derive filter state from URL (single source of truth)
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 0;
  const categoryId = searchParams.get('category')
    ? Number(searchParams.get('category'))
    : undefined;
  const brandId = searchParams.get('brand') ? Number(searchParams.get('brand')) : undefined;
  const searchValue = searchParams.get('q') ?? '';

  // Local input state drives debounce — avoids per-keystroke navigation
  const [searchInput, setSearchInput] = useState(searchValue);
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

  // Sync debounced search to URL (only when value actually changes)
  const prevDebounced = useRef(debouncedSearch);
  useEffect(() => {
    if (debouncedSearch !== prevDebounced.current) {
      prevDebounced.current = debouncedSearch;
      pushUrl({ q: debouncedSearch || undefined, page: undefined });
    }
  }, [debouncedSearch, pushUrl]);

  // TanStack Query — uses initialData from Server Component, refetches on filter change.
  // staleTime prevents a redundant fetch on mount when data is fresh from SSR.
  const queryParams: PageRequest & ProductFilters = {
    page,
    size: PAGE_SIZE,
    ...(searchValue ? { search: searchValue } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
  };

  const {
    data: productsPage,
    isLoading,
    isError,
    error,
  } = useQuery<PageResponse<ProductDTO>>({
    queryKey: productKeys.list(queryParams),
    queryFn: () => productsApi.getAll(queryParams),
    initialData: initialProducts,
    staleTime: 60_000, // 60 s — matches server revalidate; avoids redundant fetch on mount
    placeholderData: (prev) => prev, // keep stale grid visible while refetching
  });

  const { addToCart, isAdding } = useCart();

  const products = productsPage?.content ?? [];
  const totalElements = productsPage?.totalElements ?? 0;
  const totalPages = productsPage?.totalPages ?? 0;
  const activeFilterCount = [categoryId, brandId].filter(Boolean).length;

  // useCart()'s addToCart mutation already shows a success/error toast
  // internally (single source of truth for that copy — see product-detail-client.tsx's
  // matching comment), so this doesn't duplicate it.
  const handleAddToCart = useCallback(
    (productId: number) => {
      addToCart({ productId, quantity: 1 });
    },
    [addToCart]
  );

  const isRefetching = (isLoading || isPending) && products.length > 0;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0f1e]">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {isError && (
          <Alert variant="destructive" className="mb-6" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              {(error as Error)?.message ?? 'Failed to load products. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Header + Search bar */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">All Products</h1>
          {!isLoading && totalElements > 0 && (
            <p className="text-muted-foreground mt-1 text-sm" aria-live="polite">
              {totalElements.toLocaleString()} products
              {searchValue && (
                <>
                  {' '}
                  for <strong>&quot;{searchValue}&quot;</strong>
                </>
              )}
              {categoryId && categories.find((c) => c.id === categoryId) && (
                <>
                  {' '}
                  in <strong>{categories.find((c) => c.id === categoryId)?.name}</strong>
                </>
              )}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <div className="relative max-w-xl flex-1">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                id="product-search"
                type="search"
                placeholder="Search products, brands…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-11 rounded-xl pl-10"
                aria-label="Search products"
                data-testid="product-search-input"
              />
              {isPending && (
                <Loader2
                  className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Sort — only shown when there are products */}
            {totalElements > 0 && (
              <Select
                value={searchParams.get('sort') ?? 'createdAt,desc'}
                onValueChange={(value) => pushUrl({ sort: value, page: undefined })}
              >
                <SelectTrigger
                  className="hidden h-11 w-[180px] rounded-xl sm:flex"
                  aria-label="Sort products"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt,desc">Newest First</SelectItem>
                  <SelectItem value="price,asc">Price: Low to High</SelectItem>
                  <SelectItem value="price,desc">Price: High to Low</SelectItem>
                  <SelectItem value="name,asc">Name: A to Z</SelectItem>
                  <SelectItem value="averageRating,desc">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* View mode toggle */}
            <div className="hidden items-center gap-1 sm:flex">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                className="h-11 w-11 rounded-xl"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                className="h-11 w-11 rounded-xl"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-11 gap-2 rounded-xl lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
              data-testid="open-filters-button"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
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
          {/* Desktop Sidebar */}
          <div className="sticky top-24 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto lg:block">
            <FilterPanel
              categoryId={categoryId}
              brandId={brandId}
              categories={categories}
              brands={brands}
              onCategoryChange={(id) => pushUrl({ category: id, page: undefined })}
              onBrandChange={(id) => pushUrl({ brand: id, page: undefined })}
              onClearAll={() => pushUrl({ category: undefined, brand: undefined, page: undefined })}
            />
          </div>

          {/* Mobile Drawer */}
          {drawerOpen && (
            <>
              <div
                className={styles.drawerBackdrop}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              <div
                className={styles.drawer}
                role="dialog"
                aria-modal="true"
                aria-label="Product filters"
              >
                <FilterPanel
                  categoryId={categoryId}
                  brandId={brandId}
                  categories={categories}
                  brands={brands}
                  onCategoryChange={(id) => {
                    pushUrl({ category: id, page: undefined });
                    setDrawerOpen(false);
                  }}
                  onBrandChange={(id) => {
                    pushUrl({ brand: id, page: undefined });
                    setDrawerOpen(false);
                  }}
                  onClearAll={() => {
                    pushUrl({ category: undefined, brand: undefined, page: undefined });
                    setDrawerOpen(false);
                  }}
                  onClose={() => setDrawerOpen(false)}
                />
              </div>
            </>
          )}

          {/* Product Grid */}
          <div className="min-w-0 flex-1">
            {isLoading && products.length === 0 ? (
              <ProductGridSkeleton count={PAGE_SIZE} />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Package className="text-muted-foreground/30 mb-4 h-16 w-16" aria-hidden="true" />
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
                  data-testid="clear-all-filters-button"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={styles.gridWrap}>
                {isRefetching && (
                  <div
                    className={styles.loadingOverlay}
                    aria-live="polite"
                    aria-label="Updating products…"
                    role="status"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={cn(
                    viewMode === 'list' ? 'flex flex-col gap-4' : styles.grid,
                    'transition-opacity duration-200',
                    isRefetching ? 'opacity-50' : 'opacity-100'
                  )}
                >
                  {products.map((product) => (
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
