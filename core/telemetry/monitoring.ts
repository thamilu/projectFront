/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for monitoring and optimizing application performance:
 * - Performance markers and measures
 * - Component render tracking
 * - API call timing
 * - Web Vitals integration
 * - Memory usage tracking
 *
 * @module lib/performance/monitoring
 */

import { logger } from '@/core/telemetry/logger';

// ============================================================================
// Types
// ============================================================================

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface ComponentRenderMetric {
  componentName: string;
  renderTime: number;
  renderCount: number;
  props?: Record<string, unknown>;
}

// ============================================================================
// Performance Timing Utilities
// ============================================================================

/**
 * Measures execution time of a function
 *
 * @param fn - Function to measure
 * @param label - Label for the measurement
 * @returns Result of the function with timing metadata
 *
 * @example
 * ```ts
 * const result = await measurePerformance(
 *   () => fetchProducts(),
 *   'fetchProducts'
 * );
 * ```
 */
export async function measurePerformance<T>(
  fn: () => Promise<T> | T,
  label: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    // Log if duration exceeds threshold
    if (duration > 1000) {
      logger.warn(`Slow operation: ${label}`, { duration: Math.round(duration) });
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug(`Performance: ${label}`, { duration: Math.round(duration) });
    }

    return { result, duration };
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Performance measurement failed: ${label}`, {
      duration: Math.round(duration),
      error,
    });
    throw error;
  }
}

/**
 * Creates a performance timer
 *
 * @param label - Label for the timer
 * @returns Timer object with start and end methods
 *
 * @example
 * ```ts
 * const timer = createTimer('dataFetch');
 * const data = await fetchData();
 * timer.end(); // Logs duration
 * ```
 */
export function createTimer(label: string) {
  const startTime = performance.now();
  let endTime: number | null = null;

  return {
    start: () => startTime,
    end: () => {
      if (endTime !== null) {
        logger.warn('Timer already ended', { label });
        return endTime - startTime;
      }

      endTime = performance.now();
      const duration = endTime - startTime;

      logger.info(`Timer: ${label}`, { duration: Math.round(duration) });
      return duration;
    },
    getDuration: () => {
      const currentTime = endTime ?? performance.now();
      return currentTime - startTime;
    },
  };
}

// ============================================================================
// Component Performance Tracking
// ============================================================================

const renderMetrics = new Map<string, ComponentRenderMetric>();

/**
 * Tracks component render performance
 * Use in development to identify slow components
 *
 * @param componentName - Name of the component
 * @param callback - Render callback to measure
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   trackComponentRender('MyComponent', () => {
 *     // Component logic
 *   });
 *   return <div>...</div>;
 * }
 * ```
 */
export function trackComponentRender(componentName: string, callback?: () => void): void {
  if (process.env.NODE_ENV !== 'development') return;

  const startTime = performance.now();

  if (callback) {
    callback();
  }

  const renderTime = performance.now() - startTime;

  const existing = renderMetrics.get(componentName);
  if (existing) {
    existing.renderCount++;
    existing.renderTime += renderTime;
  } else {
    renderMetrics.set(componentName, {
      componentName,
      renderTime,
      renderCount: 1,
    });
  }

  // Warn if render time is excessive
  if (renderTime > 16.67) {
    // 60fps threshold
    logger.warn(`Slow render: ${componentName}`, {
      renderTime: Math.round(renderTime),
    });
  }
}

/**
 * Gets all component render metrics
 * Useful for debugging and optimization
 *
 * @returns Array of render metrics sorted by total time
 */
export function getRenderMetrics(): ComponentRenderMetric[] {
  return Array.from(renderMetrics.values()).sort((a, b) => b.renderTime - a.renderTime);
}

/**
 * Clears all render metrics
 */
export function clearRenderMetrics(): void {
  renderMetrics.clear();
}

// ============================================================================
// Web Vitals Monitoring
// ============================================================================

/**
 * Reports Web Vitals metrics
 * Integrate with analytics service
 *
 * @param metric - Web Vital metric
 *
 * @example
 * ```ts
 * // In _app.tsx or app/layout.tsx
 * import { reportWebVitals } from '@/lib/performance/monitoring';
 *
 * export { reportWebVitals };
 * ```
 */
export function reportWebVitals(metric: PerformanceMetric): void {
  const { name, value, rating } = metric;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Web Vital: ${name}`, { value: Math.round(value), rating });
  }

  // Send to analytics
  if (typeof window !== 'undefined') {
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (win.gtag) {
      win.gtag('event', name, {
        value: Math.round(value),
        metric_rating: rating,
        non_interaction: true,
      });
    }
  }
}

// ============================================================================
// Memory Monitoring
// ============================================================================

/**
 * Gets current memory usage (if available)
 *
 * @returns Memory usage in MB or null if not available
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function getMemoryUsage(): { used: number; total: number; limit: number } | null {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as unknown as { memory?: PerformanceMemory }).memory;
    if (memory) {
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
  }
  return null;
}

/**
 * Monitors memory usage and warns if threshold exceeded
 *
 * @param thresholdMB - Memory threshold in MB (default: 100)
 */
export function monitorMemory(thresholdMB = 100): void {
  const usage = getMemoryUsage();

  if (usage && usage.used > thresholdMB) {
    logger.warn('High memory usage', {
      usedMB: usage.used,
      totalMB: usage.total,
      limitMB: usage.limit,
      threshold: thresholdMB,
    });
  }
}

// ============================================================================
// API Performance Tracking
// ============================================================================

interface ApiCallMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

const apiMetrics: ApiCallMetric[] = [];
const MAX_METRICS = 100; // Keep last 100 API calls

/**
 * Tracks API call performance
 *
 * @param url - API endpoint
 * @param method - HTTP method
 * @param duration - Call duration in ms
 * @param status - HTTP status code
 */
export function trackApiCall(url: string, method: string, duration: number, status: number): void {
  const metric: ApiCallMetric = {
    url,
    method,
    duration,
    status,
    timestamp: Date.now(),
  };

  apiMetrics.push(metric);

  // Keep only last MAX_METRICS
  if (apiMetrics.length > MAX_METRICS) {
    apiMetrics.shift();
  }

  // Log slow API calls
  if (duration > 2000) {
    logger.warn('Slow API call', { url, method, duration: Math.round(duration), status });
  }
}

/**
 * Gets API performance statistics
 *
 * @returns Statistics about API calls
 */
export function getApiStats(): {
  totalCalls: number;
  averageDuration: number;
  slowestCall: ApiCallMetric | null;
  errorRate: number;
} {
  if (apiMetrics.length === 0) {
    return {
      totalCalls: 0,
      averageDuration: 0,
      slowestCall: null,
      errorRate: 0,
    };
  }

  const totalDuration = apiMetrics.reduce((sum, m) => sum + m.duration, 0);
  const errorCalls = apiMetrics.filter((m) => m.status >= 400).length;
  const slowest = apiMetrics.reduce((slowest, current) =>
    current.duration > slowest.duration ? current : slowest
  );

  return {
    totalCalls: apiMetrics.length,
    averageDuration: Math.round(totalDuration / apiMetrics.length),
    slowestCall: slowest,
    errorRate: Math.round((errorCalls / apiMetrics.length) * 100) / 100,
  };
}

/**
 * Clears API metrics
 */
export function clearApiMetrics(): void {
  apiMetrics.length = 0;
}

// ============================================================================
// Performance Marks and Measures
// ============================================================================

/**
 * Creates a performance mark
 *
 * @param name - Mark name
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measures performance between two marks
 *
 * @param name - Measure name
 * @param startMark - Start mark name
 * @param endMark - End mark name (optional, defaults to now)
 * @returns Duration in ms or null if not available
 */
export function measure(name: string, startMark: string, endMark?: string): number | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      const measure = endMark
        ? performance.measure(name, startMark, endMark)
        : performance.measure(name, startMark);
      return measure.duration;
    } catch (error) {
      logger.warn('Performance measure failed', { name, startMark, endMark, error });
      return null;
    }
  }
  return null;
}

/**
 * Clears all performance marks and measures
 */
export function clearPerformanceMarks(): void {
  if (typeof performance !== 'undefined') {
    performance.clearMarks?.();
    performance.clearMeasures?.();
  }
}

// ============================================================================
// Batch Performance Reporter
// ============================================================================

/**
 * Reports all performance data
 * Useful for debugging and optimization
 */
export function reportAllPerformanceData(): void {
  logger.info('=== Performance Report ===');

  // Memory
  const memory = getMemoryUsage();
  if (memory) {
    logger.info('Memory Usage', memory);
  }

  // API Stats
  const apiStats = getApiStats();
  logger.info('API Statistics', apiStats);

  // Component Renders
  const renders = getRenderMetrics();
  if (renders.length > 0) {
    logger.info('Component Renders (Top 10)', {
      components: renders.slice(0, 10).map((r) => ({
        name: r.componentName,
        avgTime: Math.round(r.renderTime / r.renderCount),
        totalTime: Math.round(r.renderTime),
        count: r.renderCount,
      })),
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

export type { PerformanceMetric, ComponentRenderMetric, ApiCallMetric };
