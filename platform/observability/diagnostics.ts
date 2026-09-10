import { getBreakersStatus } from '@/platform/resilience';
import { logger } from '@/core/telemetry/logger';

export interface ApiDiagnostics {
  endpoint: string;
  callsCount: number;
  failuresCount: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
}

export interface SystemDiagnostics {
  hydrationTimeMs: number | null;
  layoutShiftsExceededCount: number;
  fcpExceededCount: number;
  lcpExceededCount: number;
  renderBudgetExceededCount: number;
  routePayloadBudgetExceededCount: number;
  diagnosticsStartTime: number;
}

/**
 * Runtime Diagnostics Telemetry Platform
 *
 * Collects and serves unified frontend operational metrics.
 * Exposes a programmatic API and attaches to `window.__diagnostics` for developers and automation.
 */
class DiagnosticsPlatform {
  private apiMetrics: Map<string, { calls: number; failures: number; latencyList: number[] }> =
    new Map();
  private systemMetrics: SystemDiagnostics = {
    hydrationTimeMs: null,
    layoutShiftsExceededCount: 0,
    fcpExceededCount: 0,
    lcpExceededCount: 0,
    renderBudgetExceededCount: 0,
    routePayloadBudgetExceededCount: 0,
    diagnosticsStartTime: Date.now(),
  };

  constructor() {
    this.registerGlobalInterface();
  }

  /**
   * Record API transaction for diagnostics
   */
  public recordApiCall(endpoint: string, durationMs: number, isFailure: boolean) {
    let metric = this.apiMetrics.get(endpoint);
    if (!metric) {
      metric = { calls: 0, failures: 0, latencyList: [] };
      this.apiMetrics.set(endpoint, metric);
    }

    metric.calls++;
    if (isFailure) {
      metric.failures++;
    }

    // Maintain a rolling buffer of the last 100 requests for p95 calculations
    metric.latencyList.push(durationMs);
    if (metric.latencyList.length > 100) {
      metric.latencyList.shift();
    }
  }

  /**
   * Record hydration duration
   */
  public recordHydration(durationMs: number) {
    this.systemMetrics.hydrationTimeMs = durationMs;
  }

  /**
   * Record layout shift exceeding budget
   */
  public recordLayoutShiftExceeded() {
    this.systemMetrics.layoutShiftsExceededCount++;
  }

  /**
   * Record paint timing exceeding budget
   */
  public recordFcpExceeded() {
    this.systemMetrics.fcpExceededCount++;
  }

  /**
   * Record largest contentful paint exceeding budget
   */
  public recordLcpExceeded() {
    this.systemMetrics.lcpExceededCount++;
  }

  /**
   * Record component rendering budget exceeded
   */
  public recordRenderBudgetExceeded() {
    this.systemMetrics.renderBudgetExceededCount++;
  }

  /**
   * Record route payload budget exceeded
   */
  public recordRoutePayloadBudgetExceeded() {
    this.systemMetrics.routePayloadBudgetExceededCount++;
  }

  /**
   * Retrieve active diagnostic snapshots
   */
  public getSnapshot() {
    const apiDiagnostics: ApiDiagnostics[] = [];

    this.apiMetrics.forEach((metric, endpoint) => {
      const sortedLatencies = [...metric.latencyList].sort((a, b) => a - b);
      const sum = sortedLatencies.reduce((acc, curr) => acc + curr, 0);
      const average = sortedLatencies.length > 0 ? Math.round(sum / sortedLatencies.length) : 0;

      // Calculate 95th percentile
      const p95Idx = Math.max(0, Math.floor(sortedLatencies.length * 0.95) - 1);
      const p95 = sortedLatencies.length > 0 ? sortedLatencies[p95Idx] : 0;

      apiDiagnostics.push({
        endpoint,
        callsCount: metric.calls,
        failuresCount: metric.failures,
        averageLatencyMs: average,
        p95LatencyMs: p95,
      });
    });

    return {
      diagnosticsStartTime: new Date(this.systemMetrics.diagnosticsStartTime).toISOString(),
      uptimeSeconds: Math.round((Date.now() - this.systemMetrics.diagnosticsStartTime) / 1000),
      circuits: getBreakersStatus(),
      apiPerformance: apiDiagnostics,
      browserPerformance: {
        ...this.systemMetrics,
        browserContext:
          typeof window !== 'undefined'
            ? {
                url: window.location.href,
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                memoryUsage: (performance as any).memory
                  ? {
                      usedJSHeapSizeMb: Math.round(
                        (performance as any).memory.usedJSHeapSize / 1024 / 1024
                      ),
                      totalJSHeapSizeMb: Math.round(
                        (performance as any).memory.totalJSHeapSize / 1024 / 1024
                      ),
                    }
                  : 'Unsupported by browser',
              }
            : 'Non-browser scope',
      },
    };
  }

  /**
   * Expose diagnostics programmatically to window.__diagnostics
   */
  private registerGlobalInterface() {
    if (typeof window !== 'undefined') {
      (window as any).__diagnostics = {
        getSnapshot: () => this.getSnapshot(),
        triggerSelfCheck: () => {
          const snapshot = this.getSnapshot();
          logger.info('🔌 [DiagnosticsPlatform] Self-Check Triggered:', snapshot);
          return snapshot;
        },
      };
      logger.info('🔌 [DiagnosticsPlatform] Exposed global window.__diagnostics control.');
    }
  }
}

export const diagnostics = new DiagnosticsPlatform();
export default diagnostics;
