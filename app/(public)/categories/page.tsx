'use client';

import Link from 'next/link';
import { Grid, ChevronRight, AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/routes';
import { useCategories } from '@/features/products/hooks/use-products';
import { CATEGORIES, findCategoryBySlug } from '@/shared/constants';
import { CategoryIcon } from '@/shared/ui/common/CategoryIcon';

export default function CategoriesPage() {
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  return (
    <div className="container mx-auto px-4 py-10" min-h-screen="true">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Grid className="text-primary h-6 w-6" aria-hidden="true" />
          <h1 className="text-3xl font-bold tracking-tight">All Categories</h1>
        </div>
        <p className="text-muted-foreground">Browse products across all categories.</p>
      </div>

      {isLoading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          data-testid="categories-loading"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="bg-muted h-32 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-md py-20 text-center" data-testid="categories-error">
          <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Failed to load categories</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  There was a problem communicating with the server. Please check your connection.
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : categories.length === 0 ? (
        <div
          className="text-muted-foreground bg-muted/5 rounded-xl border border-dashed py-20 text-center"
          data-testid="categories-empty"
        >
          <Grid className="mx-auto mb-4 h-12 w-12 opacity-30" aria-hidden="true" />
          <h3 className="text-foreground text-lg font-medium">No categories available</h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-sm">
            Check back later or browse all products using the main menu.
          </p>
          <Button asChild className="mt-6" variant="secondary">
            <Link href={APP_ROUTES.PRODUCTS}>Browse All Products</Link>
          </Button>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          data-testid="categories-grid"
        >
          {categories.map((cat) => {
            const slug = cat.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
            const staticCat =
              CATEGORIES.find((c) => c.name.toLowerCase() === cat.name.toLowerCase()) ||
              findCategoryBySlug(slug);
            const gradientClass = staticCat ? staticCat.gradientClass : 'bg-slate-500';
            const iconName = staticCat ? staticCat.iconName : 'Default';

            return (
              <Link
                key={cat.id}
                href={`${APP_ROUTES.PRODUCTS}?categoryId=${cat.id}`}
                className="group focus-visible:ring-primary block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label={`Browse products in category ${cat.name}`}
              >
                <Card className="border-muted bg-card group-hover:border-primary/30 h-full border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <CardContent className="flex flex-col items-start gap-4 p-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${gradientClass} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <CategoryIcon name={iconName} className="h-6 w-6" />
                    </div>
                    <div className="w-full flex-1">
                      <h2 className="text-foreground group-hover:text-primary font-semibold transition-colors duration-200">
                        {cat.name}
                      </h2>
                      {cat.description && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="border-muted/50 mt-2 flex w-full items-center justify-between border-t pt-2">
                      <span className="text-muted-foreground text-xs">Explore category</span>
                      <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
