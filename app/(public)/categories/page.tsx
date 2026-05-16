'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Grid, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/constants/routes/app-routes';

interface CategoryDTO {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Electronics: '💻',
  Fashion: '👗',
  Home: '🏠',
  Sports: '⚽',
  Beauty: '💄',
  Toys: '🧸',
  Books: '📚',
  Food: '🍔',
  Automotive: '🚗',
  Garden: '🌱',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/categories?size=50')
      .then((r) => r.json())
      .then((d) => setCategories(d?.data?.content ?? d?.content ?? d?.data ?? []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Grid className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">All Categories</h1>
        </div>
        <p className="text-muted-foreground">Browse products across all categories.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Grid className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>No categories available.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`${APP_ROUTES.PRODUCTS}?categoryId=${cat.id}`}
              className="group block"
            >
              <Card className="h-full border-0 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                <CardContent className="flex flex-col items-start gap-3 p-5">
                  <span className="text-4xl" role="img" aria-label={cat.name}>
                    {CATEGORY_EMOJIS[cat.name] ?? '🛍️'}
                  </span>
                  <div className="flex-1">
                    <h2 className="font-semibold group-hover:text-primary transition-colors">
                      {cat.name}
                    </h2>
                    {cat.productCount !== undefined && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {cat.productCount.toLocaleString()} products
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
