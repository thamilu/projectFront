'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import { Card, CardContent, CardFooter } from '@/shared/ui/atoms/card';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

interface ProductDTO {
  id: number;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  brand?: { name: string };
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(() => searchParams?.get('q') ?? '');
  const [results, setResults] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const q = searchParams?.get('q') ?? '';

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/products?search=${encodeURIComponent(q)}&size=20`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setResults(d?.data?.content ?? d?.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(() => {
      router.push(`${APP_ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories…"
            className="h-12 pl-10 text-base"
            autoFocus
          />
        </div>
        <Button size="lg" type="submit" disabled={isPending}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>

      {/* Results header */}
      {q && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {loading ? 'Searching…' : `${results.length} results for `}
            {!loading && <strong className="text-foreground">&ldquo;{q}&rdquo;</strong>}
          </p>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && q && results.length === 0 && (
        <div className="py-20 text-center">
          <Search className="text-muted-foreground/40 mx-auto mb-4 h-16 w-16" />
          <h2 className="mb-2 text-xl font-semibold">No results found</h2>
          <p className="text-muted-foreground mb-6">
            Try different keywords or{' '}
            <Link href={APP_ROUTES.PRODUCTS} className="text-primary hover:underline">
              browse all products
            </Link>
            .
          </p>
        </div>
      )}

      {/* Landing — no query */}
      {!q && (
        <div className="py-20 text-center">
          <Search className="text-muted-foreground/40 mx-auto mb-4 h-16 w-16" />
          <h2 className="text-xl font-semibold">What are you looking for?</h2>
          <p className="text-muted-foreground mt-2">
            Type a product name, brand, or category above.
          </p>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((product) => (
            <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <Link href={APP_ROUTES.PRODUCT_DETAIL(String(product.id))}>
                <div className="bg-muted relative aspect-square">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
                      No image
                    </div>
                  )}
                  {product.discountPrice && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}
                      %
                    </Badge>
                  )}
                </div>
              </Link>
              <CardContent className="p-3">
                <Link href={APP_ROUTES.PRODUCT_DETAIL(String(product.id))}>
                  <h3 className="line-clamp-2 text-sm font-medium hover:underline">
                    {product.name}
                  </h3>
                </Link>
                {product.brand && (
                  <p className="text-muted-foreground mt-1 text-xs">{product.brand.name}</p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between p-3 pt-0">
                <div>
                  <span className="font-bold">
                    ₹{(product.discountPrice || product.price).toLocaleString()}
                  </span>
                  {product.discountPrice && (
                    <span className="text-muted-foreground ml-2 text-xs line-through">
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  <ShoppingCart className="h-4 w-4" />
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
          <Search className="text-muted-foreground h-8 w-8 animate-pulse" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
