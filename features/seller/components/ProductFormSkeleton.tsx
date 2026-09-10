'use client';

import type { ReactElement } from 'react';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Card, CardContent } from '@/shared/ui/atoms/card';

export function ProductFormSkeleton(): ReactElement {
  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="product-form-skeleton">
      {/* Form Title & Description Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex space-x-2 border-b pb-px">
        {['Basic Info', 'Pricing', 'Inventory', 'Details', 'Advanced'].map((tab) => (
          <Skeleton key={tab} className="h-10 w-24 rounded-t-lg" />
        ))}
      </div>

      {/* Form Content Skeleton */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="col-span-1 space-y-2 md:col-span-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
