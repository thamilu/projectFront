// ============================================================
// core/telemetry/logger.factory.ts
// Structured logging factory — eliminates magic prefix strings
// Ensures consistent log shape for Datadog / CloudWatch / ELK
// ============================================================

import { logger } from '@/core/telemetry/logger';

// ─── Types ───────────────────────────────────────────────────

export type LogMeta = Record<string, unknown>;

export interface IServiceLogger {
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
}

// ─── Factory ─────────────────────────────────────────────────

/**
 * Creates a structured service-scoped logger.
 * Automatically injects `service` field into every log entry.
 *
 * @example
 * const log = createServiceLogger('AuthService');
 * log.error('Login failed', { userId: '123' });
 * // → { service: 'AuthService', message: 'Login failed', userId: '123' }
 */
export function createServiceLogger(serviceName: string): IServiceLogger {
  const enrichMeta = (meta?: LogMeta): LogMeta => ({
    service: serviceName,
    ...meta,
  });

  return {
    info(message: string, meta?: LogMeta): void {
      logger.info(message, enrichMeta(meta));
    },

    warn(message: string, meta?: LogMeta): void {
      logger.warn(message, enrichMeta(meta));
    },

    error(message: string, meta?: LogMeta): void {
      logger.error(message, enrichMeta(meta));
    },

    debug(message: string, meta?: LogMeta): void {
      logger.debug(message, enrichMeta(meta));
    },
  };
}
