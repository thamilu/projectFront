import React from 'react';

interface Props {
  count?: number;
}

export function ProductListSkeleton({ count = 6 }: Props) {
  const items = Array.from({ length: count }).map((_, i) => i);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((i) => (
        <div key={i} className="animate-pulse rounded-lg border p-4">
          <div className="h-48 w-full bg-gray-200 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default ProductListSkeleton;
