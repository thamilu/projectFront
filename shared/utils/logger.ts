import { logger as telemetryLogger } from '@/core/telemetry/logger';

export interface LogContext {
  component?: string;
  [key: string]: unknown;
}

/**
 * Structured Logger Wrapper
 * Delegates to the enterprise telemetry logger to ensure environment gating,
 * PII redaction, and proper formatting on both server and client.
 */
export const logger = {
  debug: (message: string, context?: LogContext) => {
    telemetryLogger.debug(message, context);
  },
  info: (message: string, context?: LogContext) => {
    telemetryLogger.info(message, context);
  },
  warn: (message: string, context?: LogContext) => {
    telemetryLogger.warn(message, context);
  },
  error: (message: string, context?: LogContext) => {
    telemetryLogger.error(message, context);
  },
};
