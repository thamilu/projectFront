import React from 'react';
import Image from 'next/image';

export interface ProductGridProps {
  products?: unknown[];
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
}

export function ProductGrid({ products = [] }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p: unknown, idx: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prod = p as Record<string, any>;
        return (
          <article key={prod?.id ?? idx} className="rounded-lg border p-4">
            <div className="relative h-48 w-full bg-gray-100 mb-4 flex items-center justify-center overflow-hidden">
              {prod?.imageUrl ? (
                <Image src={String(prod.imageUrl)} alt={String(prod.name ?? prod.title ?? 'product')} fill className="object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">No image</span>
              )}
            </div>
            <h3 className="text-lg font-medium">{prod?.name ?? prod?.title ?? 'Product'}</h3>
            {typeof prod?.price === 'number' && (
              <p className="mt-2 text-sm text-muted-foreground">${(prod.price as number).toFixed(2)}</p>
            )}
          </article>
        )
      })}
    </div>
  );
}

export default ProductGrid;
