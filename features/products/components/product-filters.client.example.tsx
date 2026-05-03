/**
 * Product Filters - Client Component
 *
 * Enterprise patterns:
 * - Client-side interactivity with URL state sync
 * - Debounced input for performance
 * - Form validation with Zod
 * - Accessible keyboard navigation
 * - Optimistic UI updates
 *
 * @module components/products/product-filters.client
 */

'use client';

import React, { useCallback, useTransition } from 'react';
import type { Resolver } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, SlidersHorizontal } from 'lucide-react';

// ============================================================================
// Types & Validation Schema
// ============================================================================

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: FilterFormData['sort'];
}

const FilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['price,asc', 'price,desc', 'createdAt,desc', 'rating,desc']).optional(),
});

type FilterFormData = z.infer<typeof FilterSchema>;

// ============================================================================
// Component
// ============================================================================

export function ProductFilters({
  categories,
  selectedCategory,
  minPrice,
  maxPrice,
  sort,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Form state with validation
  // Ensure resolver type matches react-hook-form types
  const resolver = zodResolver(FilterSchema) as unknown as Resolver<FilterFormData>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver,
    defaultValues: {
      category: selectedCategory,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort: (sort as FilterFormData['sort']) || 'createdAt,desc',
    },
  });

  /**
   * Update URL with filter params
   *
   * PERFORMANCE: useTransition for non-blocking navigation
   * Time Complexity: O(1)
   */
  const updateFilters = useCallback(
    (data: FilterFormData) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams?.toString() ?? '');

        // Update params
        if (data.category) {
          params.set('category', data.category);
        } else {
          params.delete('category');
        }

        if (data.minPrice !== undefined && data.minPrice > 0) {
          params.set('minPrice', data.minPrice.toString());
        } else {
          params.delete('minPrice');
        }

        if (data.maxPrice !== undefined && data.maxPrice > 0) {
          params.set('maxPrice', data.maxPrice.toString());
        } else {
          params.delete('maxPrice');
        }

        if (data.sort && data.sort !== 'createdAt,desc') {
          params.set('sort', data.sort);
        } else {
          params.delete('sort');
        }

        // Reset to page 0 when filters change
        params.delete('page');

        // Navigate with new params
        router.push(`/products?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      // Keep only search param if it exists
      const search = params.get('search');
      params.forEach((_, key) => {
        if (key !== 'search') {
          params.delete(key);
        }
      });

      router.push(search ? `/products?search=${search}` : '/products', { scroll: false });
    });
  }, [router, searchParams]);

  /**
   * Handle category change
   */
  const handleCategoryChange = useCallback(
    (value: string) => {
      setValue('category', value === 'all' ? undefined : value);
      handleSubmit(updateFilters)();
    },
    [setValue, handleSubmit, updateFilters]
  );

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback(
    (value: string) => {
      setValue('sort', value as FilterFormData['sort']);
      handleSubmit(updateFilters)();
    },
    [setValue, handleSubmit, updateFilters]
  );

  // Watch for price range changes (debounced)

  // const watchedMinPrice = watch('minPrice');

  // const watchedMaxPrice = watch('maxPrice');

  const hasActiveFilters =
    selectedCategory || minPrice || maxPrice || (sort && sort !== 'createdAt,desc');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={isPending}
              className="h-8 px-2 text-xs"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(updateFilters)} className="space-y-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={selectedCategory || 'all'}
              onValueChange={handleCategoryChange}
              disabled={isPending}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                    {category.productCount !== undefined && (
                      <span className="text-muted-foreground ml-2">({category.productCount})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <Label>Price Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice" className="text-muted-foreground text-xs">
                  Min
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  {...register('minPrice')}
                  disabled={isPending}
                  className={errors.minPrice ? 'border-destructive' : ''}
                />
                {errors.minPrice && (
                  <p className="text-destructive mt-1 text-xs">{errors.minPrice.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="maxPrice" className="text-muted-foreground text-xs">
                  Max
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Any"
                  {...register('maxPrice')}
                  disabled={isPending}
                  className={errors.maxPrice ? 'border-destructive' : ''}
                />
                {errors.maxPrice && (
                  <p className="text-destructive mt-1 text-xs">{errors.maxPrice.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sort">Sort By</Label>
            <Select
              value={sort || 'createdAt,desc'}
              onValueChange={handleSortChange}
              disabled={isPending}
            >
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt,desc">Newest First</SelectItem>
                <SelectItem value="price,asc">Price: Low to High</SelectItem>
                <SelectItem value="price,desc">Price: High to Low</SelectItem>
                <SelectItem value="rating,desc">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply Button */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Applying...' : 'Apply Filters'}
          </Button>
        </form>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded px-2 py-1 text-xs">
                  {selectedCategory}
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded px-2 py-1 text-xs">
                  ${minPrice || '0'} - ${maxPrice || '∞'}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Performance: Memoize component to prevent unnecessary re-renders
export default React.memo(ProductFilters);
