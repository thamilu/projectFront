/**
 * Code Splitting and Lazy Loading Utilities
 *
 * Utilities for optimizing bundle size and load performance
 * through dynamic imports and lazy loading
 *
 * @module lib/performance/code-splitting
 */

import dynamic from 'next/dynamic';
import { ComponentType, lazy, ReactNode } from 'react';

/**
 * Loading fallback component
 */
export function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}

/**
 * Creates a dynamically imported component with loading state
 *
 * @param importFn - Dynamic import function
 * @param options - Configuration options
 * @returns Dynamically loaded component
 *
 * @example
 * ```tsx
 * const HeavyChart = lazyLoad(
 *   () => import('./HeavyChart'),
 *   { fallback: <ChartSkeleton /> }
 * );
 * ```
 */
export function lazyLoad<T extends ComponentType>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: ReactNode;
    ssr?: boolean;
  }
): T {
  return dynamic(importFn, {
    loading: () => options?.fallback ?? <DefaultLoadingFallback />,
    ssr: options?.ssr ?? true,
  }) as T;
}

/**
 * Lazy loads a component only when it enters viewport
 * Useful for below-the-fold content
 *
 * @param importFn - Dynamic import function
 * @returns Lazy loaded component
 *
 * @example
 * ```tsx
 * const Footer = lazyLoadOnVisible(() => import('./Footer'));
 * ```
 */
export function lazyLoadOnVisible<T extends ComponentType>(
  importFn: () => Promise<{ default: T }>
): T {
  if (typeof window === 'undefined') {
    // SSR: load immediately
    return lazy(importFn) as unknown as T;
  }

  // CSR: load when IntersectionObserver is supported
  if ('IntersectionObserver' in window) {
    return dynamic(importFn, {
      loading: () => <DefaultLoadingFallback />,
      ssr: false,
    }) as T;
  }

  // Fallback: immediate load
  return dynamic(importFn, {
    loading: () => <DefaultLoadingFallback />,
  }) as T;
}

/**
 * Preloads a component for faster subsequent loads
 * Call this when you anticipate the component will be needed soon
 *
 * @param importFn - Dynamic import function
 *
 * @example
 * ```tsx
 * function ProductCard() {
 *   const handleMouseEnter = () => {
 *     // Preload the details page component
 *     preloadComponent(() => import('@/app/products/[id]/page'));
 *   };
 * }
 * ```
 */
export function preloadComponent(importFn: () => Promise<unknown>): void {
  if (typeof window !== 'undefined') {
    // Trigger the import but don't wait for it
    importFn().catch(() => {
      // Silently ignore preload failures
    });
  }
}

/**
 * Route-based code splitting helper
 * Optimizes bundle splitting for Next.js pages
 *
 * @example
 * ```tsx
 * // In app/admin/users/page.tsx
 * const UserManagement = routeSplit(() => import('./UserManagement'));
 * ```
 */
export function routeSplit<T extends ComponentType>(importFn: () => Promise<{ default: T }>): T {
  return dynamic(importFn, {
    loading: () => <DefaultLoadingFallback />,
    ssr: true,
  }) as T;
}

/**
 * Modal/Dialog lazy loader
 * Loads modals only when opened
 *
 * @example
 * ```tsx
 * const CheckoutModal = modalSplit(() => import('./CheckoutModal'));
 *
 * function ProductPage() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Checkout</button>
 *       {isOpen && <CheckoutModal />}
 *     </>
 *   );
 * }
 * ```
 */
export function modalSplit<T extends ComponentType>(importFn: () => Promise<{ default: T }>): T {
  return dynamic(importFn, {
    loading: () => null, // No loading state for modals
    ssr: false, // Modals don't need SSR
  }) as T;
}

/**
 * Heavy library lazy loader
 * Use for large third-party libraries
 *
 * @example
 * ```tsx
 * const ReactPDF = libraryLazyLoad(() => import('@react-pdf/renderer'));
 * ```
 */
export function libraryLazyLoad<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
  return importFn().then((module) => module.default);
}
