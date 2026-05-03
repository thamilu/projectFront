/**
 * Root Loading UI
 * 
 * Shown while the root page is loading/compiling.
 * Improves perceived performance with skeleton UI.
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Skeleton */}
      <div className="relative h-[600px] bg-gradient-to-r from-primary/10 to-secondary/10 animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6">
            <div className="h-12 bg-muted rounded-md w-3/4"></div>
            <div className="h-6 bg-muted rounded-md w-full"></div>
            <div className="h-6 bg-muted rounded-md w-2/3"></div>
            <div className="flex gap-4 mt-8">
              <div className="h-12 bg-muted rounded-md w-32"></div>
              <div className="h-12 bg-muted rounded-md w-32"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="h-8 bg-muted rounded-md w-48 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
