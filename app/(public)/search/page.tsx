'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, SlidersHorizontal, ShoppingCart, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import { Card, CardContent, CardFooter } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { APP_ROUTES } from '@/shared/routes';
import { useSearchProducts } from '@/features/products/hooks/use-products';
import { useCart } from '@/features/cart/hooks/use-cart';
import { formatPrice, calculateDiscount } from '@/shared/utils';

// A search query beyond this length can't plausibly be a real product
// search — reject it client-side instead of forwarding an unbounded string
// to the backend on every keystroke-driven navigation.
const MAX_QUERY_LENGTH = 200;

function sanitizeQuery(raw: string): string {
  return raw.trim().slice(0, MAX_QUERY_LENGTH);
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(() => sanitizeQuery(searchParams?.get('q') ?? ''));
  const { addToCart, isAdding } = useCart();

  const q = sanitizeQuery(searchParams?.get('q') ?? '');

  // Synchronize internal input state if search query parameter changes
  useEffect(() => {
    setQuery(q);
  }, [q]);

  const { data, isLoading, isError, refetch } = useSearchProducts(q, { page: 0, size: 20 });
  const results = data?.content ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sanitizeQuery(query);
    if (!trimmed) return;
    startTransition(() => {
      router.push(`${APP_ROUTES.SEARCH}?q=${encodeURIComponent(trimmed)}`);
    });
  };

  const handleOpenFilters = () => {
    // The full filter panel (category/brand/price/sort) already lives on
    // the products listing page and reads the same `q` param — rather than
    // duplicate that UI here, hand the current search off to it.
    router.push(`${APP_ROUTES.PRODUCTS}?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories…"
            className="focus-visible:ring-primary h-12 pl-10 text-base focus-visible:ring-offset-2"
            autoFocus
            aria-label="Search products, brands, or categories"
          />
        </div>
        <Button
          size="lg"
          type="submit"
          disabled={isPending || !query.trim()}
          className="min-h-[44px] px-6"
        >
          <Search className="mr-2 h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      {/* Results header / loading */}
      {q && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {isLoading ? (
              'Searching…'
            ) : (
              <>
                {results.length} results for{' '}
                <strong className="text-foreground font-semibold">&ldquo;{q}&rdquo;</strong>
              </>
            )}
          </p>
          <Button variant="outline" size="sm" className="min-h-[44px]" onClick={handleOpenFilters}>
            <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
            Filters
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && q && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="search-loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="bg-muted aspect-square w-full animate-pulse rounded-xl" />
              <Skeleton className="bg-muted mt-2 h-4 w-3/4 animate-pulse rounded" />
              <Skeleton className="bg-muted h-3 w-1/2 animate-pulse rounded" />
              <Skeleton className="bg-muted mt-2 h-6 w-1/3 animate-pulse rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && q && (
        <div className="mx-auto max-w-md py-20 text-center" data-testid="search-error">
          <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Search failed</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Could not retrieve search results from the server. Please try again.
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex min-h-[44px] items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && q && results.length === 0 && (
        <div
          className="bg-muted/5 rounded-xl border border-dashed py-20 text-center"
          data-testid="search-empty"
        >
          <Search className="text-muted-foreground/40 mx-auto mb-4 h-16 w-16" aria-hidden="true" />
          <h2 className="mb-2 text-xl font-semibold">No results found</h2>
          <p className="text-muted-foreground mx-auto mb-6 max-w-sm">
            Try checking your spelling, using different keywords, or{' '}
            <Link href={APP_ROUTES.PRODUCTS} className="text-primary hover:underline">
              browse all products
            </Link>
            .
          </p>
        </div>
      )}

      {/* Landing state (no query yet) */}
      {!q && (
        <div className="py-20 text-center">
          <Search className="text-muted-foreground/30 mx-auto mb-4 h-16 w-16" aria-hidden="true" />
          <h2 className="text-xl font-semibold">What are you looking for?</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xs">
            Type a product name, brand, or category above to begin your search.
          </p>
        </div>
      )}

      {/* Results grid */}
      {!isLoading && !isError && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="search-results-grid">
          {results.map((product) => (
            <Card
              key={product.id}
              className="border-muted bg-card flex h-full flex-col overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              <Link
                href={APP_ROUTES.PRODUCT_DETAIL(String(product.id))}
                className="group block focus-visible:outline-none"
              >
                <div className="bg-muted relative aspect-square w-full overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
                      No image
                    </div>
                  )}
                  {product.discountPrice && product.price && (
                    <Badge className="absolute top-2 right-2 border-none bg-red-600 font-semibold text-white hover:bg-red-700">
                      -{calculateDiscount(product.price, product.discountPrice)}%
                    </Badge>
                  )}
                </div>
              </Link>
              <CardContent className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <Link
                    href={APP_ROUTES.PRODUCT_DETAIL(String(product.id))}
                    className="focus-visible:underline focus-visible:outline-none"
                  >
                    <h3 className="text-foreground hover:text-primary line-clamp-2 text-sm font-medium transition-colors duration-200">
                      {product.name}
                    </h3>
                  </Link>
                  {product.brand && (
                    <p className="text-muted-foreground mt-1 text-xs">{product.brand.name}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between p-4 pt-0">
                <div className="flex flex-col">
                  <span className="text-foreground text-lg font-bold">
                    {formatPrice(product.discountPrice || product.price)}
                  </span>
                  {product.discountPrice && (
                    <span className="text-muted-foreground text-xs line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex h-10 min-h-[40px] w-10 min-w-[40px] items-center justify-center rounded-full p-0"
                  aria-label={`Add ${product.name} to cart`}
                  disabled={isAdding}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart({ productId: product.id, quantity: 1 });
                  }}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Search className="text-muted-foreground h-8 w-8 animate-pulse" aria-hidden="true" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
