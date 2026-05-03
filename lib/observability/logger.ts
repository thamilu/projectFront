/* eslint-disable no-console */
/**
 * Enterprise Structured Logging Module
 *
 * Provides centralized, structured logging for observability
 *
 * Features:
 * - Structured JSON logs (machine-parsable)
 * - Log levels (debug, info, warn, error)
 * - Contextual metadata
 * - Environment-aware (dev vs prod)
 * - Request correlation IDs
 * - Integration-ready (Datadog, CloudWatch, etc.)
 *
 * Best Practices:
 * - Log at appropriate levels
 * - Include relevant context
 * - Never log secrets/PII
 * - Use correlation IDs for distributed tracing
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  service: string;
  environment: string;
  version?: string;
  requestId?: string;
}

// ============================================================================
// Configuration
// ============================================================================

interface LoggerConfig {
  service: string;
  environment: string;
  version?: string;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// Logger Class
// ============================================================================

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      service: process.env.SERVICE_NAME || 'ecommerce-frontend',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || undefined,
      minLevel: this.getMinLogLevel(),
      ...config,
    };
  }

  /**
   * Determines minimum log level from environment
   *
   * Production: info (hide debug logs)
   * Development: debug (show all logs)
   */
  private getMinLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
      return envLevel;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  /**
   * Checks if log level should be emitted
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Formats log entry as structured JSON
   */
  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      environment: this.config.environment,
    };

    if (this.config.version) {
      entry.version = this.config.version;
    }

    if (context) {
      // Sanitize context - remove sensitive data
      entry.context = this.sanitizeContext(context);
    }

    return entry;
  }

  /**
   * Removes sensitive data from log context
   *
   * Prevents accidental logging of:
   * - Passwords
   * - Tokens
   * - API keys
   * - PII (configurable)
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sensitiveKeys = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'idToken',
      'secret',
      'apiKey',
      'authorization',
      'cookie',
      'codeVerifier',
    ];

    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();

      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        // Preserve useful diagnostics. Error fields are non-enumerable so a naive
        // object sanitize would erase them (showing `{}` in logs).
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
          cause: value.cause,
        };
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value as LogContext);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Writes log entry to appropriate output stream
   */
  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Use a safe JSON stringify to avoid throwing on circular refs or BigInt
    const safeStringify = (obj: unknown): string => {
      try {
        const seen = new WeakSet();
        return JSON.stringify(obj, function (_key, value) {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack,
              cause: value.cause,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(value as any),
            };
          }
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
          }
          return value;
        });
      } catch {
        try {
          return String(obj);
        } catch {
          return '[unserializable]';
        }
      }
    };

    const output = safeStringify(entry);

    // Safely log without calling potentially overridden console methods
    // Some runtimes can throw when calling console.error/debug directly; to be robust
    // we always use console.log and coerce the value safely.
    const safeConsoleMethod = (
      _method: 'log' | 'info' | 'warn' | 'error' | 'debug',
      value?: string
    ) => {
      try {
        try {
          console.log(value);
          return;
        } catch {
          // Fallback to coercion if console.log itself throws
        }
        try {
          console.log(String(value));
        } catch {
          // swallow any remaining errors
        }
      } catch {
        // swallow to avoid crashing
      }
    };

    try {
      switch (entry.level) {
        case 'error':
          safeConsoleMethod('error', output);
          break;
        case 'warn':
          safeConsoleMethod('warn', output);
          break;
        case 'debug':
          if (this.config.environment === 'development') {
            // console.debug may be undefined in some runtimes
            safeConsoleMethod('debug', output);
          }
          break;
        default:
          safeConsoleMethod('log', output);
      }
    } catch {
      // swallow any unexpected error to ensure logger never throws
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Logs debug message (development only)
   *
   * Use for:
   * - Development debugging
   * - Detailed execution traces
   * - State inspection
   *
   * @example
   * logger.debug('Processing user request', { userId, action });
   */
  debug(message: string, context?: LogContext): void {
    this.write(this.formatEntry('debug', message, context));
  }

  /**
   * Logs informational message
   *
   * Use for:
   * - Normal operation events
   * - Business logic milestones
   * - Successful operations
   *
   * @example
   * logger.info('User logged in', { userId, loginMethod: 'keycloak' });
   */
  info(message: string, context?: LogContext): void {
    this.write(this.formatEntry('info', message, context));
  }

  /**
   * Logs warning message
   *
   * Use for:
   * - Recoverable errors
   * - Deprecated API usage
   * - Potential issues
   *
   * @example
   * logger.warn('Token near expiration', { userId, expiresIn: 60 });
   */
  warn(message: string, context?: LogContext): void {
    this.write(this.formatEntry('warn', message, context));
  }

  /**
   * Logs error message
   *
   * Use for:
   * - Unhandled exceptions
   * - Failed operations
   * - System errors
   *
   * @example
   * logger.error('Authentication failed', {
   *   requestId,
   *   error: error.message,
   *   stack: error.stack,
   * });
   */
  error(message: string, context?: LogContext): void {
    this.write(this.formatEntry('error', message, context));
  }

  /**
   * Creates child logger with additional context
   *
   * Useful for request-scoped logging with correlation IDs
   *
   * @example
   * const requestLogger = logger.child({ requestId: 'req-123' });
   * requestLogger.info('Processing request'); // includes requestId
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.config);

    // Override write to inject additional context
    const originalWrite = childLogger.write.bind(childLogger);
    childLogger.write = (entry: LogEntry) => {
      entry.context = {
        ...additionalContext,
        ...entry.context,
      };
      originalWrite(entry);
    };

    return childLogger;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const logger = new Logger();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates request-scoped logger with correlation ID
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   const log = getRequestLogger(req);
 *   log.info('Handling auth request');
 * }
 */
export function getRequestLogger(requestId?: string, additionalContext?: LogContext): Logger {
  const context: LogContext = {
    requestId: requestId || crypto.randomUUID(),
    ...additionalContext,
  };

  return logger.child(context);
}

/**
 * Logs performance metrics
 *
 * @example
 * const start = Date.now();
 * await someOperation();
 * logPerformance('someOperation', Date.now() - start);
 */
export function logPerformance(operation: string, durationMs: number, context?: LogContext): void {
  const level: LogLevel = durationMs > 1000 ? 'warn' : 'info';

  logger[level](`Performance: ${operation}`, {
    operation,
    durationMs,
    ...context,
  });
}

/**
 * Logs security event
 *
 * Use for:
 * - Authentication attempts
 * - Authorization failures
 * - Suspicious activity
 *
 * @example
 * logSecurityEvent('Failed login attempt', {
 *   email: 'user@example.com',
 *   reason: 'Invalid credentials',
 *   ipAddress: req.ip,
 * });
 */
export function logSecurityEvent(event: string, context: LogContext): void {
  logger.warn(`Security: ${event}`, {
    ...context,
    securityEvent: true,
  });
}

/**
 * Logs API call
 *
 * @example
 * logApiCall('GET', '/api/auth/me', 200, 150);
 */
export function logApiCall(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: LogContext
): void {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  logger[level]('API call', {
    method,
    path,
    statusCode,
    durationMs,
    ...context,
  });
}
