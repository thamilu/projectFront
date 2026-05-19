import { logger } from '@/core/telemetry/logger';

export interface PerformanceBudget {
  apiLatencyMs: number;
  clsLimit: number;
  fcpMs: number;
  lcpMs: number;
  hydrationLimitMs: number;
  renderLimitMs: number;
  routePayloadLimitKb: number;
}

export const DEFAULT_BUDGET: PerformanceBudget = {
  apiLatencyMs: 1500, // 1.5s degradation threshold
  clsLimit: 0.1,      // Cumulative Layout Shift budget
  fcpMs: 1000,        // First Contentful Paint budget
  lcpMs: 2500,        // Largest Contentful Paint budget
  hydrationLimitMs: 500,     // React hydration budget (500ms)
  renderLimitMs: 16,         // Target component render duration (16ms = 1 frame at 60fps)
  routePayloadLimitKb: 128,  // Max JSON payload size per route transition (128KB)
};

class ObservabilityPlatform {
  private budget: PerformanceBudget = DEFAULT_BUDGET;
  private isBrowser = typeof window !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      this.initWebVitalsListener();
    }
  }

  /**
   * Configure custom metrics budgets
   */
  configureBudget(customBudget: Partial<PerformanceBudget>) {
    this.budget = { ...this.budget, ...customBudget };
  }

  /**
   * Tracks an API call and detects degradation
   */
  trackApiCall(endpoint: string, durationMs: number, correlationId?: string) {
    const isDegraded = durationMs > this.budget.apiLatencyMs;
    
    // Log diagnostics
    import('./diagnostics').then(({ diagnostics }) => {
      diagnostics.recordApiCall(endpoint, durationMs, isDegraded);
    }).catch(() => {});

    if (isDegraded) {
      logger.warn('⚠️ [Observability] API Degradation Detected!', {
        endpoint,
        durationMs,
        budgetLimit: this.budget.apiLatencyMs,
        correlationId,
      });
    } else {
      logger.info('📊 [Observability] API Latency:', {
        endpoint,
        durationMs,
        correlationId,
      });
    }
  }

  /**
   * Correlate UI Error with Correlation ID
   */
  correlateError(error: Error, metadata: Record<string, unknown> = {}) {
    const errorId = `err_${Math.random().toString(36).substring(2, 9)}`;
    const correlationId = metadata.correlationId || (this.isBrowser ? (window as any).__correlationId : undefined);

    logger.error('🚨 [Observability] Correlated Error:', {
      errorId,
      correlationId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...metadata,
    });

    return errorId;
  }

  /**
   * Listen to and validate Next.js/Browser Web Vitals
   */
  private initWebVitalsListener() {
    try {
      // Support native performance observers
      if ('PerformanceObserver' in window) {
        // 1. Check CLS
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > this.budget.clsLimit) {
            import('./diagnostics').then(({ diagnostics }) => {
              diagnostics.recordLayoutShiftExceeded();
            }).catch(() => {});
            
            logger.warn('⚠️ [Observability] CLS Budget Exceeded!', {
              clsValue,
              budget: this.budget.clsLimit,
            });
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // 2. Check FCP & LCP
        const paintObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              if (entry.startTime > this.budget.fcpMs) {
                import('./diagnostics').then(({ diagnostics }) => {
                  diagnostics.recordFcpExceeded();
                }).catch(() => {});
                
                logger.warn('⚠️ [Observability] FCP Budget Exceeded!', {
                  fcpMs: entry.startTime,
                  budget: this.budget.fcpMs,
                });
              }
            }
          }
        });
        paintObserver.observe({ type: 'paint', buffered: true });

        // 3. Check LCP
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry.startTime > this.budget.lcpMs) {
            import('./diagnostics').then(({ diagnostics }) => {
              diagnostics.recordLcpExceeded();
            }).catch(() => {});

            logger.warn('⚠️ [Observability] LCP Budget Exceeded!', {
              lcpMs: lastEntry.startTime,
              budget: this.budget.lcpMs,
            });
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      }
    } catch (err) {
      logger.debug('[Observability] Failed to hook PerformanceObserver', { error: String(err) });
    }
  }

  /**
   * Track hydration time (Hydration Governance)
   */
  trackHydrationTime(durationMs: number) {
    import('./diagnostics').then(({ diagnostics }) => {
      diagnostics.recordHydration(durationMs);
      
      const isExceeded = durationMs > this.budget.hydrationLimitMs;
      if (isExceeded) {
        logger.warn('⚠️ [Observability] Hydration Budget Exceeded!', {
          durationMs,
          budget: this.budget.hydrationLimitMs,
        });
      } else {
        logger.info('⚡ [Observability] Hydration Time Measured:', {
          durationMs,
        });
      }
    }).catch(() => {});
  }

  /**
   * Track component render time (Rendering Governance)
   */
  trackRenderTime(componentName: string, durationMs: number) {
    import('./diagnostics').then(({ diagnostics }) => {
      const isExceeded = durationMs > this.budget.renderLimitMs;
      if (isExceeded) {
        diagnostics.recordRenderBudgetExceeded();
        logger.warn('⚠️ [Observability] Component Render Budget Exceeded!', {
          componentName,
          durationMs,
          budget: this.budget.renderLimitMs,
        });
      } else {
        logger.debug('📊 [Observability] Component Render Time:', {
          componentName,
          durationMs,
        });
      }
    }).catch(() => {});
  }

  /**
   * Track route payload size (Route Payload Budget)
   */
  trackRoutePayload(route: string, payloadSizeKb: number) {
    import('./diagnostics').then(({ diagnostics }) => {
      const isExceeded = payloadSizeKb > this.budget.routePayloadLimitKb;
      if (isExceeded) {
        diagnostics.recordRoutePayloadBudgetExceeded();
        logger.warn('⚠️ [Observability] Route Payload Budget Exceeded!', {
          route,
          payloadSizeKb,
          budget: this.budget.routePayloadLimitKb,
        });
      } else {
        logger.info('📊 [Observability] Route Payload Size:', {
          route,
          payloadSizeKb,
        });
      }
    }).catch(() => {});
  }
}

export const observability = new ObservabilityPlatform();
export default observability;
