import { CircuitBreaker, CircuitBreakerConfig } from './CircuitBreaker';
import { logger } from '@/core/telemetry/logger';

export * from './CircuitBreaker';

const breakersRegistry: Map<string, CircuitBreaker> = new Map();

/**
 * Get or create a named Circuit Breaker instance
 */
export function getOrCreateBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
  let breaker = breakersRegistry.get(name);
  if (!breaker) {
    breaker = new CircuitBreaker(name, config);
    breakersRegistry.set(name, breaker);
    logger.info(`🔌 [ResilienceRegistry] Registered new CircuitBreaker "${name}"`);
  }
  return breaker;
}

/**
 * Get all registered circuit breakers and their statuses
 */
export function getBreakersStatus(): Array<{ name: string; state: string }> {
  return Array.from(breakersRegistry.entries()).map(([name, breaker]) => ({
    name,
    state: breaker.getState(),
  }));
}

export interface RetryConfig {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

/**
 * Execute an asynchronous action with Retry Governance (Exponential Backoff + Full Jitter)
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const retries = config.retries ?? 3;
  const baseDelayMs = config.baseDelayMs ?? 1000;
  const maxDelayMs = config.maxDelayMs ?? 10000;
  const useJitter = config.jitter ?? true;

  let attempt = 0;

  while (true) {
    try {
      return await action();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        throw error;
      }

      // Calculate exponential delay: base * 2^(attempt - 1)
      const expDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));

      // Full Jitter formula: random between 0 and expDelay
      const delay = useJitter ? Math.random() * expDelay : expDelay;

      logger.warn(
        `🔄 [RetryGovernor] Attempt ${attempt}/${retries} failed. Retrying in ${Math.round(delay)}ms...`,
        { error: String(error) }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Resilience Orchestrator
 *
 * Combines Retry Governance with Circuit Breaker protection.
 * Runs retry backoffs inside the circuit boundaries, failing fast if the circuit trips.
 */
export async function executeResiliently<T>(
  key: string,
  action: () => Promise<T>,
  options: CircuitBreakerConfig & RetryConfig = {}
): Promise<T> {
  const breaker = getOrCreateBreaker(key, options);

  // Wrap the call inside the Circuit Breaker
  return breaker.execute(() => {
    // Perform Retry Governance inside the closed circuit
    return retryWithBackoff(action, options);
  });
}
