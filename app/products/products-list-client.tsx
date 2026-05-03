'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/features/cart/hooks/use-cart';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { ProductDTO, CategoryDTO, BrandDTO, PageResponse } from '@/types';
import { ShoppingCart, Search, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/constants/routes/app-routes';

interface ProductsListClientProps {
  initialProducts: PageResponse<ProductDTO>;
  categories: CategoryDTO[];
  brands: BrandDTO[];
  searchParams: Record<string, string | undefined>;
}

export default function ProductsListClient({
  initialProducts,
  categories,
  brands,
  searchParams,
}: ProductsListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { addToCart, isAdding } = useCart();

  const currentPage = parseInt(searchParams.page || '0');
  const currentSearch = searchParams.search || '';
  const currentCategory = searchParams.categoryId || '';
  const currentBrand = searchParams.brandId || '';
  const currentSort = searchParams.sort || 'createdAt,desc';

  const updateSearchParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    
    // Keep existing params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset page when filters change
    if (!updates.page) {
      params.delete('page');
    }

    startTransition(() => {
      router.push(`${APP_ROUTES.PRODUCTS}?${params.toString()}`);
    });
  };

  const handleAddToCart = async (productId: number, productName: string) => {
    try {
      await addToCart({ productId, quantity: 1 });
      toast.success('Added to cart', { description: productName });
    } catch (_error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="mt-2 text-muted-foreground">
          Showing {initialProducts.content.length} of {initialProducts.totalElements} products
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Filters Sidebar */}
        <aside className="space-y-6">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                defaultValue={currentSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setTimeout(() => updateSearchParams({ search: value }), 500);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <Select
              value={currentCategory}
              onValueChange={(value) => updateSearchParams({ categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">Brand</label>
            <Select
              value={currentBrand}
              onValueChange={(value) => updateSearchParams({ brandId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(currentCategory || currentBrand || currentSearch) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(APP_ROUTES.PRODUCTS)}
            >
              Clear All Filters
            </Button>
          )}
        </aside>

        {/* Products Grid */}
        <div>
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select
                value={currentSort}
                onValueChange={(value) => updateSearchParams({ sort: value })}
              >
                <SelectTrigger className="w-[180px]">
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
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                aria-label="Switch to grid view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                aria-label="Switch to list view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          {initialProducts.content.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-medium">No products found</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'space-y-4'
              }
            >
              {initialProducts.content.map((product: ProductDTO) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onAddToCart={handleAddToCart}
                  isAdding={isAdding}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {initialProducts.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => updateSearchParams({ page: Math.max(0, currentPage - 1).toString() })}
                disabled={currentPage === 0 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="mx-4 text-sm text-muted-foreground">
                Page {currentPage + 1} of {initialProducts.totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => updateSearchParams({ page: (currentPage + 1).toString() })}
                disabled={currentPage >= initialProducts.totalPages - 1 || isPending}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  viewMode,
  onAddToCart,
  isAdding,
}: {
  product: ProductDTO;
  viewMode: 'grid' | 'list';
  onAddToCart: (id: number, name: string) => void;
  isAdding: boolean;
}) {
  const discountPercent = product.discountPrice
    ? calculateDiscount(product.price, product.discountPrice)
    : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images = ((product as any).images as { id?: number; url: string }[] | undefined) ?? (product.imageUrl ? [{ id: product.id, url: product.imageUrl }] : []);
  const hasImage = images.length > 0;

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex gap-4 p-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Link href={`/products/${(product as any).urlSlug || product.id}`} className="relative h-32 w-32 flex-shrink-0">
            {hasImage ? (
              <Image
                src={images[0].url}
                alt={product.name}
                fill
                className="rounded-lg object-cover"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                No image
              </div>
            )}
            {discountPercent > 0 && (
              <Badge className="absolute right-2 top-2 bg-red-500">-{discountPercent}%</Badge>
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-between">
            <div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Link href={`/products/${(product as any).urlSlug || product.id}`}>
                <h3 className="font-semibold hover:underline">{product.name}</h3>
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold">
                  {formatPrice(product.discountPrice || product.price)}
                </span>
                {product.discountPrice && (
                  <span className="ml-2 text-sm text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              <Button
                onClick={() => onAddToCart(product.id, product.name)}
                disabled={isAdding || product.stockQuantity === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link href={`/products/${(product as any).urlSlug || product.id}`} className="relative block aspect-square">
        {hasImage ? (
          <Image
            src={images[0].url}
            alt={product.name}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
            No image
          </div>
        )}
        {discountPercent > 0 && (
          <Badge className="absolute right-2 top-2 bg-red-500">-{discountPercent}%</Badge>
        )}
      </Link>

      <CardHeader className="p-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link href={`/products/${(product as any).urlSlug || product.id}`}>
          <CardTitle className="line-clamp-2 text-base hover:underline">
            {product.name}
          </CardTitle>
        </Link>
        {product.brand && (
          <CardDescription className="text-xs">{product.brand.name}</CardDescription>
        )}
      </CardHeader>

      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div>
          <span className="text-lg font-bold">
            {formatPrice(product.discountPrice || product.price)}
          </span>
          {product.discountPrice && (
            <span className="ml-2 text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => onAddToCart(product.id, product.name)}
          disabled={isAdding || product.stockQuantity === 0}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
