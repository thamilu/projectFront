/**
 * Product List Component
 * Displays a grid of products with pagination
 */

'use client';

import { ProductDTO } from '@/types';
import { ProductCard } from './product-card';
import { LoadingSpinner } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Package } from 'lucide-react';

interface ProductListProps {
  products: ProductDTO[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProductList({
  products,
  isLoading,
  emptyMessage = 'No products found',
}: ProductListProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-12 w-12" />}
        title="No Products"
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
