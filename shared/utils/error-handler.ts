import { logger } from '@/core/telemetry/logger';
import { captureException } from '@sentry/nextjs';

/**
 * Wraps a promise-returning function with structured logging and error reporting.
 * Automatically logs failures using the telemetry logger and tracks exceptions via Sentry.
 *
 * @param fn - The asynchronous function to execute.
 * @param context - Diagnostic label/context describing the operation.
 * @param fallback - The fallback value to return in case of failure.
 * @returns The resolved value of the function, or the fallback value.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T> | T,
  context: string,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error(`Error in ${context}`, {
      error: err.message,
      stack: err.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Capture exception in Sentry for production monitoring
    captureException(err);

    return fallback;
  }
}
