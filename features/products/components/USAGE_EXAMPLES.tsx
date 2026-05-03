'use client';

/**
 * Example Usage: ProductCard and Related Components
 * 
 * This file demonstrates how to use the refactored ProductCard,
 * ProductCardSkeleton, ProductPrice, and useWishlistToggle hook.
 */

import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card';
import { ProductPrice } from '@/components/products/product-price';
import { useWishlistToggle } from '@/hooks/useWishlistToggle';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ProductDTO } from '@/types';
import { useState, useTransition, Suspense } from 'react';

// ============================================================================
// Example 1: Product Grid with Loading State
// ============================================================================

export function ProductGrid({ products, isLoading }: { products: ProductDTO[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard 
          key={product.id} 
          product={product}
          // Mark first 4 cards as priority for LCP optimization
          priority={index < 4}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Example 2: Featured Product with Custom Price Display
// ============================================================================

export function FeaturedProduct({ product }: { product: ProductDTO }) {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-2xl font-bold">{product.name}</h2>
      <p className="mb-4 text-muted-foreground">{product.description}</p>
      
      {/* Using ProductPrice component standalone */}
      <ProductPrice
        price={product.price}
        discountPrice={product.discountPrice}
        currency="INR"
        locale="en-IN"
        className="mb-4"
      />
      
      <div className="text-sm text-muted-foreground">
        {product.stockQuantity > 0 ? (
          <span className="text-green-600">In Stock ({product.stockQuantity} available)</span>
        ) : (
          <span className="text-red-600">Out of Stock</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Custom Component Using useWishlistToggle Hook
// ============================================================================

export function QuickActionsBar({ product }: { product: ProductDTO }) {
  const { isInWishlist, toggle } = useWishlistToggle(product);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await toggle();
      if (result.action === 'added') {
        toast.success('Added to wishlist!');
      } else {
        toast.success('Removed from wishlist');
      }
    } catch (_error) {
      toast.error('Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleToggle} disabled={isLoading} variant="outline">
        <Heart className={cn('mr-2 h-4 w-4', isInWishlist && 'fill-current')} />
        {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </Button>
    </div>
  );
}

// ============================================================================
// Example 4: International Pricing with ProductPrice
// ============================================================================

export function InternationalProductCard({ product, userLocale, userCurrency }: {
  product: ProductDTO;
  userLocale: string;
  userCurrency: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">{product.name}</h3>
      
      {/* Automatic currency conversion and formatting */}
      <ProductPrice
        price={product.price}
        discountPrice={product.discountPrice}
        currency={userCurrency}
        locale={userLocale}
      />
      
      {/* Example outputs:
          - en-US, USD: $49.99
          - fr-FR, EUR: 45,99 €
          - ja-JP, JPY: ¥5,999
          - de-DE, EUR: 45,99 €
      */}
    </div>
  );
}

// ============================================================================
// Example 5: Responsive Product Grid with Suspense
// ============================================================================

// Mock function for demonstration
async function fetchProducts(): Promise<ProductDTO[]> {
  // In real app, this would be an API call
  return [];
}

export async function ProductsPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Our Products</h1>
      
      <Suspense fallback={
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }>
        <ProductList />
      </Suspense>
    </div>
  );
}

async function ProductList() {
  const products = await fetchProducts();
  
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product: ProductDTO, index: number) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4} // Prioritize first row for LCP
        />
      ))}
    </div>
  );
}

// ============================================================================
// Example 6: Filtering with Loading States
// ============================================================================



// Mock component for demonstration
function ProductGridContent({ category }: { category: string }) {
  return <div>Products for {category}</div>;
}

export function FilterableProductGrid() {
  const [category, setCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = (newCategory: string) => {
    startTransition(() => {
      setCategory(newCategory);
    });
  };

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <Button onClick={() => handleCategoryChange('all')}>All</Button>
        <Button onClick={() => handleCategoryChange('electronics')}>Electronics</Button>
        <Button onClick={() => handleCategoryChange('fashion')}>Fashion</Button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ProductGridContent category={category} />
      )}
    </div>
  );
}

// ============================================================================
// Best Practices Summary
// ============================================================================

/*

✅ DO:
- Use ProductCard for consistent product display across the app
- Use ProductCardSkeleton during loading states for better UX
- Pass priority={true} to first 3-4 visible cards for LCP optimization
- Use ProductPrice component for consistent currency formatting
- Use useWishlistToggle hook when building custom wishlist UI

✅ DO NOT:
- Wrap ProductCard in another <Link> (it's already clickable)
- Nest buttons inside ProductCard's clickable area without stopPropagation
- Use hardcoded $ symbols - use ProductPrice for i18n support
- Forget to handle loading states in parent components

🎯 Performance Tips:
- ProductCard uses optimized Zustand selectors (no unnecessary re-renders)
- ProductCardSkeleton prevents layout shift during loading
- priority prop enables Next.js Image preloading for above-fold content
- useWishlistToggle has built-in memoization for expensive lookups

♿ Accessibility Features:
- Full keyboard navigation support
- Screen reader announcements for all interactive elements
- Proper ARIA labels and roles
- Respects prefers-reduced-motion
- High contrast mode support

📱 Mobile Optimizations:
- Wishlist button always visible on touch devices
- Proper tap target sizes (44×44px minimum)
- Responsive image sizing with sizes prop
- Touch-friendly spacing and layout

*/
