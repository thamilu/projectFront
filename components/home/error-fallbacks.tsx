import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SectionErrorProps {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

// ============================================================================
// Base Component
// ============================================================================

/**
 * Composable section error component with mobile-responsive layout
 * and WCAG 2.2 compliant touch targets
 * 
 * Features:
 * - Responsive flex layout (stacks on mobile, inline on desktop)
 * - 44×44px minimum touch target for retry button
 * - Proper ARIA attributes for screen readers
 * - Consistent padding and styling
 * 
 * @example
 * ```tsx
 * <SectionError
 *   title="Failed to load products"
 *   message="Unable to fetch products. Please try again."
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function SectionError({ 
  title, 
  message, 
  onRetry,
  className 
}: SectionErrorProps) {
  return (
    <section className={cn("container mx-auto px-4 py-8", className)}>
      <Alert variant="destructive" role="alert" aria-live="polite">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">{message}</span>
            {onRetry && (
              <Button 
                variant="secondary"
                size="sm" 
                onClick={onRetry}
                aria-label={`Retry: ${title}`}
                className="min-h-[44px] min-w-[44px] shrink-0"
              >
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </section>
  );
}

// ============================================================================
// Pre-configured Variants (for backward compatibility and convenience)
// ============================================================================

export function FlashDealsError({ onRetry }: Pick<SectionErrorProps, 'onRetry'>) {
  return (
    <SectionError
      title="Failed to load flash deals"
      message="Unable to fetch flash deals. Please try again."
      onRetry={onRetry}
    />
  );
}

export function FeaturedProductsError({ onRetry }: Pick<SectionErrorProps, 'onRetry'>) {
  return (
    <SectionError
      title="Failed to load featured products"
      message="Unable to fetch featured products. Please try again."
      onRetry={onRetry}
    />
  );
}

export function FeaturedStoresError({ onRetry }: Pick<SectionErrorProps, 'onRetry'>) {
  return (
    <SectionError
      title="Failed to load stores"
      message="Unable to fetch seller stores. Please try again."
      onRetry={onRetry}
    />
  );
}

export function TestimonialsError({ onRetry }: Pick<SectionErrorProps, 'onRetry'>) {
  return (
    <SectionError
      title="Failed to load testimonials"
      message="Unable to load customer testimonials. Please try again."
      onRetry={onRetry}
    />
  );
}

export function AppDownloadError({ onRetry }: Pick<SectionErrorProps, 'onRetry'>) {
  return (
    <SectionError
      title="Failed to load app download section"
      message="Unable to load app information. Please try again."
      onRetry={onRetry}
    />
  );
}

export function SectionErrorFallback({ 
  section, 
  onRetry 
}: Pick<SectionErrorProps, 'onRetry'> & { section?: string }) {
  return (
    <SectionError
      title="Section Error"
      message={`Unable to load ${section || 'this section'}. Please refresh the page.`}
      onRetry={onRetry}
    />
  );
}
