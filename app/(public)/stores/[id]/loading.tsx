import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/ui/atoms/card';

export default function StoreLoading() {
  return (
    <div className="animate-in fade-in container mx-auto space-y-8 py-10 duration-500">
      {/* Header Skeleton */}
      <Card className="bg-background/50 overflow-hidden border-none shadow-2xl backdrop-blur-md">
        <div className="bg-muted/20 h-2" />
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <div className="space-y-6 md:col-span-1">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <div className="space-y-8 md:col-span-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-lg">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="space-y-2 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
