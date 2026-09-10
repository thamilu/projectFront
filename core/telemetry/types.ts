import type { LogContext } from './logger';

/**
 * Telemetry structured logging context types.
 */
export interface PageRenderLogContext extends LogContext {
  userId: string;
  hasCustomerData: boolean;
  isCustomerDashboardActive: boolean;
  sectionsCount: number;
  renderDuration: number;
  timestamp: string;
}
