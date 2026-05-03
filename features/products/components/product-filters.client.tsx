"use client";

import React from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
}

interface Props {
  categories: Category[];
  selectedCategory?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

export function ProductFilters({ categories = [], selectedCategory }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Categories</h4>
        <ul className="space-y-2">
          <li>
            <Link href="/products" className={`block ${!selectedCategory ? 'font-bold' : 'text-muted-foreground'}`}>
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/products?category=${encodeURIComponent(c.slug)}`} className={`block ${selectedCategory === c.slug ? 'font-bold' : 'text-muted-foreground'}`}>
                {c.name} {typeof c.productCount === 'number' && (<span className="text-xs text-muted-foreground">({c.productCount})</span>)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default React.memo(ProductFilters);
