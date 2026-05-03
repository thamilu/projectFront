/**
 * Lightweight Circuit Breaker implementation
 * - Keeps state per key (service or endpoint)
 * - Opens after `failureThreshold` consecutive failures
 * - Resets to HALF_OPEN after `resetTimeout` ms
 * - On HALF_OPEN, allows a limited number of trial requests
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

interface BreakerOptions {
  failureThreshold?: number; // failures to open
  resetTimeout?: number; // ms to try half-open
  halfOpenMaxSuccesses?: number; // successes required to close
}

class BreakerEntry {
  public state: CircuitState = 'CLOSED';
  public failures = 0;
  public lastFailureAt = 0;
  public successCount = 0;

  constructor(public options: Required<BreakerOptions>) {}
}

export class CircuitBreaker {
  private entries = new Map<string, BreakerEntry>();
  private defaultOptions: Required<BreakerOptions> = {
    failureThreshold: 5,
    resetTimeout: 30_000,
    halfOpenMaxSuccesses: 3,
  };

  constructor(options?: BreakerOptions) {
    if (options) this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  private getEntry(key: string) {
    if (!this.entries.has(key)) {
      this.entries.set(key, new BreakerEntry({ ...this.defaultOptions }));
    }
    return this.entries.get(key)!;
  }

  public async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const entry = this.getEntry(key);

    // Transition from OPEN -> HALF_OPEN if reset timeout passed
    if (entry.state === 'OPEN' && Date.now() - entry.lastFailureAt > entry.options.resetTimeout) {
      entry.state = 'HALF_OPEN';
      entry.successCount = 0;
      entry.failures = 0;
    }

    if (entry.state === 'OPEN') {
      throw new CircuitOpenError();
    }

    try {
      const result = await fn();

      // On success
      if (entry.state === 'HALF_OPEN') {
        entry.successCount++;
        if (entry.successCount >= entry.options.halfOpenMaxSuccesses) {
          entry.state = 'CLOSED';
          entry.failures = 0;
          entry.successCount = 0;
        }
      } else {
        entry.failures = 0;
      }

      return result;
    } catch (err) {
      entry.failures++;
      entry.lastFailureAt = Date.now();

      if (entry.failures >= entry.options.failureThreshold) {
        entry.state = 'OPEN';
      }

      // When in HALF_OPEN and a failure occurs, go back to OPEN
      if (entry.state === 'HALF_OPEN') {
        entry.state = 'OPEN';
      }

      throw err;
    }
  }

  public status(key: string) {
    const entry = this.getEntry(key);
    return {
      state: entry.state,
      failures: entry.failures,
      lastFailureAt: entry.lastFailureAt,
    };
  }
}

export default CircuitBreaker;
