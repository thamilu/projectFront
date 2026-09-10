/**
 * Error Serializer Utility
 *
 * Safely serializes unknown errors for logging.
 * Strips stack traces in production, preserving them in development/testing.
 * Prevents unintentional leakage of PII, bearer tokens, or database internals.
 */

export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Only include stack trace in non-production environments
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    };
  }
  return { raw: String(error) };
}
