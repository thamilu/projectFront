// ============================================================
// features/auth/utils/retry.util.ts
// Generic exponential backoff retry utility.
// Used for resilient session fetching over flaky networks.
// ============================================================

// ─── Types ───────────────────────────────────────────────────

export interface RetryOptions {
  /** Number of additional attempts after initial failure */
  retries: number;
  /** Delay in milliseconds before the first retry */
  delayMs: number;
  /** Multiplier applied to delay on each subsequent retry */
  backoff?: number;
  /** Optional predicate — return false to stop retrying early */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

// ─── Implementation ───────────────────────────────────────────

/**
 * Executes an async function with exponential backoff retry logic.
 * Throws the final error if all retries are exhausted.
 *
 * @param fn - Async operation to attempt
 * @param options - Retry configuration
 *
 * @example
 * const session = await withRetry(() => getSession(), {
 *   retries: 2,
 *   delayMs: 300,
 *   backoff: 2,
 * });
 * // Attempts: immediately → 300ms → 600ms → throws
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { retries, delayMs, backoff = 1, shouldRetry } = options;

  let lastError: unknown;
  let currentDelay = delayMs;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === retries;
      if (isLastAttempt) break;

      // Allow early abort via predicate
      if (shouldRetry && !shouldRetry(error, attempt)) break;

      await sleep(currentDelay);
      currentDelay *= backoff;
    }
  }

  throw lastError;
}

/**
 * Races `promise` against a timeout, rejecting if `timeoutMs` elapses first.
 *
 * Retry/backoff alone only bounds operations that fail fast; a request that
 * simply hangs (pending forever, never resolves or rejects) would otherwise
 * never trigger a retry at all. This provides the independent upper bound
 * that failure mode needs.
 *
 * @example
 * const session = await withTimeout(getSession(), 8000, 'Session fetch timed out');
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

// ─── Private Helpers ──────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
