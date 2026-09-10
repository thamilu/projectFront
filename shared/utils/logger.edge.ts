/* eslint-disable no-console */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const isDev = process.env.NODE_ENV === 'development';

function formatEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (!isDev) return;
    console.debug(JSON.stringify(formatEntry('debug', message, context)));
  },
  info(message: string, context?: Record<string, unknown>): void {
    console.info(JSON.stringify(formatEntry('info', message, context)));
  },
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(JSON.stringify(formatEntry('warn', message, context)));
  },
  error(message: string, context?: Record<string, unknown>): void {
    console.error(JSON.stringify(formatEntry('error', message, context)));
  },
} as const;
