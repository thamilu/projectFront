import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function StoreLoading() {
  return (
    <div className="container mx-auto py-10 space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <Card className="border-none shadow-2xl bg-background/50 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-muted/20" />
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <div className="md:col-span-3 space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-lg">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex justify-between items-center pt-2">
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
