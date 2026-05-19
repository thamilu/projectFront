/**
 * Performance Monitoring Hook
 *
 * React hook for tracking component performance
 *
 * @module hooks/use-performance
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  measurePerformance,
  trackComponentRender,
  createTimer,
} from '@/core/telemetry/monitoring';
import { logger } from '@/core/telemetry/logger';

interface UsePerformanceOptions {
  /** Component name for tracking */
  name: string;
  /** Log every render (default: false) */
  logEachRender?: boolean;
  /** Warn threshold in ms (default: 16.67 for 60fps) */
  warnThreshold?: number;
}

/**
 * Hook to track component performance
 *
 * Measures:
 * - Mount time
 * - Render count
 * - Slow renders
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function ProductList() {
 *   usePerformance({ name: 'ProductList', warnThreshold: 50 });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePerformance(options: UsePerformanceOptions) {
  const { name, logEachRender = false, warnThreshold = 16.67 } = options;

  const renderCount = useRef(0);
  const mountTime = useRef<number | null>(null);
  const renderStart = useRef<number>(performance.now());

  // Track mount
  useEffect(() => {
    const mountDuration = performance.now() - renderStart.current;
    mountTime.current = mountDuration;

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Component mounted: ${name}`, {
        mountTime: Math.round(mountDuration),
      });
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Component unmounted: ${name}`, {
          totalRenders: renderCount.current,
        });
      }
    };
  }, [name]);

  // Track renders
  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    renderCount.current++;

    trackComponentRender(name);

    if (renderTime > warnThreshold) {
      logger.warn(`Slow render: ${name}`, {
        renderTime: Math.round(renderTime),
        renderCount: renderCount.current,
      });
    } else if (logEachRender && process.env.NODE_ENV === 'development') {
      logger.debug(`Render: ${name}`, {
        renderTime: Math.round(renderTime),
        renderCount: renderCount.current,
      });
    }

    renderStart.current = performance.now();
  });
}

/**
 * Hook to measure async operation performance
 *
 * @returns Object with measureAsync function
 *
 * @example
 * ```tsx
 * function ProductFetcher() {
 *   const { measureAsync } = useAsyncPerformance();
 *
 *   const fetchProducts = async () => {
 *     const { result } = await measureAsync(
 *       () => api.getProducts(),
 *       'fetchProducts'
 *     );
 *     return result;
 *   };
 * }
 * ```
 */
export function useAsyncPerformance() {
  return {
    measureAsync: measurePerformance,
    createTimer,
  };
}

/**
 * Hook to track render count
 *
 * @param componentName - Name for tracking
 * @returns Current render count
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const renderCount = useRenderCount('MyComponent');
 *
 *   if (renderCount > 10) {
 *     console.warn('Component re-rendering too much!');
 *   }
 * }
 * ```
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;

    if (process.env.NODE_ENV === 'development' && renderCount.current % 10 === 0) {
      logger.warn(`${componentName} has rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}
