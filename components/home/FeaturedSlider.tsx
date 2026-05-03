import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Static Data
// ============================================================================

/**
 * Mock product data for best sellers carousel
 * In production, this would be fetched from API or database
 */
const MOCK_ITEMS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: (49 + i * 5).toFixed(2),
}));

// ============================================================================
// Types
// ============================================================================

interface FeaturedSliderProps {
  title?: string;
  viewAllHref?: string;
  items?: Array<{
    id: number;
    name: string;
    price: string;
    image?: string;
  }>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Horizontal scrollable product carousel with accessibility support
 * 
 * Features:
 * - Server Component (zero client JS by default)
 * - Accessible with ARIA semantics
 * - Scroll snap for touch precision
 * - Responsive card widths
 * - Dark mode compatible
 * - Keyboard navigable
 * 
 * @example
 * ```tsx
 * <FeaturedSlider />
 * <FeaturedSlider title="Top Rated" viewAllHref="/top-rated" />
 * ```
 */
export default function FeaturedSlider({
  title = "Best Sellers",
  viewAllHref = "/products",
  items = MOCK_ITEMS,
}: FeaturedSliderProps) {
  // Empty state handling
  if (!items || items.length === 0) {
    return (
      <section className="py-8" aria-labelledby="bestsellers-heading">
        <div className="container mx-auto px-4 md:px-6">
          <h3 id="bestsellers-heading" className="text-xl font-bold mb-4">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground text-center py-8">
            No products available at the moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8" aria-labelledby="bestsellers-heading">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="bestsellers-heading" className="text-xl font-bold">
            {title}
          </h3>
          <Link 
            href={viewAllHref} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            See all
          </Link>
        </div>

        <div 
          role="region"
          aria-label={`${title} product carousel`}
          className={cn(
            "flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4",
            "snap-x snap-mandatory overscroll-x-contain",
            "scroll-smooth scrollbar-none touch-pan-x"
          )}
        >
          {items.map((it, index) => (
            <Link
              key={it.id}
              href={`/products/${it.id}`}
              className={cn(
                "snap-start group shrink-0",
                "min-w-[75vw] sm:min-w-[200px] lg:min-w-[240px]"
              )}
              aria-setsize={items.length}
              aria-posinset={index + 1}
            >
              <Card 
                className={cn(
                  "h-full transition-all duration-200",
                  "hover:shadow-md active:scale-[0.98]",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <CardContent className="p-4">
                  <div 
                    className={cn(
                      "h-36 bg-muted rounded-md mb-3",
                      "flex items-center justify-center",
                      "group-hover:bg-muted/80 transition-colors",
                      "relative overflow-hidden"
                    )}
                  >
                    {/* Placeholder for future Image component */}
                    <span className="text-muted-foreground text-sm">Image</span>
                  </div>
                  
                  <div 
                    className={cn(
                      "text-sm font-medium mb-1 line-clamp-2",
                      "group-hover:text-primary transition-colors"
                    )}
                  >
                    {it.name}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    ${it.price}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
