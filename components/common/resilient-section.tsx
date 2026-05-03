/**
 * Resilient Section Wrapper
 * 
 * Provides consistent error boundary + suspense wrapping for page sections.
 * Ensures graceful degradation and loading states for all dynamic content.
 * 
 * @module components/common/resilient-section
 */

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from './error-boundary';

interface ResilientSectionProps {
  /**
   * The section content to render
   */
  children: ReactNode;
  
  /**
   * Error fallback UI to show if section fails
   */
  fallback: ReactNode;
  
  /**
   * Loading skeleton to show while section is loading
   */
  skeleton: ReactNode;
  
  /**
   * Optional error callback for monitoring/logging
   */
  onError?: (error: Error) => void;
}

/**
 * Wraps a section with error boundary and suspense for resilient rendering
 * 
 * @example
 * ```tsx
 * <ResilientSection 
 *   fallback={<FlashDealsError />} 
 *   skeleton={<FlashDealsSkeleton />}
 * >
 *   <FlashDealsSection />
 * </ResilientSection>
 * ```
 */
export function ResilientSection({ 
  children, 
  fallback, 
  skeleton, 
  onError 
}: ResilientSectionProps) {
  return (
    <ErrorBoundary 
      fallback={fallback}
      onError={onError ? (error) => onError(error) : undefined}
    >
      <Suspense fallback={skeleton}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
