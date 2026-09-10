import { logger } from '@/core/telemetry/logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number; // Number of failures before tripping the circuit (default: 5)
  recoveryTimeoutMs?: number; // Time in ms before attempting recovery in HALF_OPEN (default: 15000)
  halfOpenMaxSuccesses?: number; // Number of consecutive successes required in HALF_OPEN to close the circuit (default: 3)
}

/**
 * Stateful Client-Side Circuit Breaker
 *
 * Protects frontend application threads from cascading backend timeouts and service degradation.
 * Automatically trips to OPEN when failures exceed the threshold, failing fast to prevent UI lockup.
 */
export class CircuitBreaker {
  public readonly name: string;
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastStateChange: number = Date.now();

  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private readonly halfOpenMaxSuccesses: number;

  constructor(name: string, config: CircuitBreakerConfig = {}) {
    this.name = name;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.recoveryTimeoutMs = config.recoveryTimeoutMs ?? 15000;
    this.halfOpenMaxSuccesses = config.halfOpenMaxSuccesses ?? 3;
  }

  /**
   * Get the current state of the circuit
   */
  public getState(): CircuitState {
    this.checkRecoveryTimeout();
    return this.state;
  }

  /**
   * Execute an asynchronous action through the circuit breaker protection
   */
  public async execute<T>(action: () => Promise<T>): Promise<T> {
    this.checkRecoveryTimeout();

    if (this.state === 'OPEN') {
      logger.warn(
        `🔌 [CircuitBreaker:${this.name}] Blocked execution. Circuit is OPEN. Failing fast.`
      );
      throw new Error(`Circuit breaker "${this.name}" is OPEN. Fast failing request.`);
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Transition directly to a target state
   */
  private transitionTo(newState: CircuitState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    this.successCount = 0;
    this.failureCount = 0;

    logger.warn(`🔌 [CircuitBreaker:${this.name}] Transitioned: ${oldState} ➡️ ${newState}`);

    // Register state changes in global window scope for diagnostics
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('circuit-breaker-change', {
        detail: { name: this.name, from: oldState, to: newState, timestamp: Date.now() },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Handle successful operation execution
   */
  public recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      logger.info(
        `🔌 [CircuitBreaker:${this.name}] Success in HALF_OPEN: ${this.successCount}/${this.halfOpenMaxSuccesses}`
      );

      if (this.successCount >= this.halfOpenMaxSuccesses) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0; // Reset continuous failure count
    }
  }

  /**
   * Handle execution failure
   */
  public recordFailure() {
    this.failureCount++;
    logger.warn(
      `🔌 [CircuitBreaker:${this.name}] Failure recorded: ${this.failureCount}/${this.failureThreshold}`
    );

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.transitionTo('OPEN');
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in half-open instantly trips the circuit back to OPEN
      this.transitionTo('OPEN');
    }
  }

  /**
   * Automatically transition from OPEN to HALF_OPEN when recovery time expires
   */
  private checkRecoveryTimeout() {
    if (this.state === 'OPEN' && Date.now() - this.lastStateChange > this.recoveryTimeoutMs) {
      logger.info(
        `🔌 [CircuitBreaker:${this.name}] Recovery timeout reached. Transitioning to HALF_OPEN.`
      );
      this.transitionTo('HALF_OPEN');
    }
  }
}
