import { CircuitBreaker } from '@/platform/resilience/CircuitBreaker';

jest.mock('@/core/telemetry/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('CircuitBreaker', () => {
  it('starts CLOSED', () => {
    const breaker = new CircuitBreaker('test-closed');
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('stays CLOSED and resets the failure count on an intervening success', () => {
    const breaker = new CircuitBreaker('test-reset', { failureThreshold: 3 });
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordSuccess();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('trips to OPEN once the failure threshold is reached', () => {
    const breaker = new CircuitBreaker('test-trip', { failureThreshold: 3 });
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe('CLOSED');
    breaker.recordFailure();
    expect(breaker.getState()).toBe('OPEN');
  });

  it('fails fast with a rejected promise while OPEN', async () => {
    const breaker = new CircuitBreaker('test-fail-fast', { failureThreshold: 1 });
    breaker.recordFailure();
    expect(breaker.getState()).toBe('OPEN');

    const action = jest.fn().mockResolvedValue('should not run');
    await expect(breaker.execute(action)).rejects.toThrow(/is OPEN/);
    expect(action).not.toHaveBeenCalled();
  });

  it('transitions OPEN -> HALF_OPEN once the recovery timeout elapses', () => {
    jest.useFakeTimers();
    try {
      const breaker = new CircuitBreaker('test-recovery', {
        failureThreshold: 1,
        recoveryTimeoutMs: 10_000,
      });
      breaker.recordFailure();
      expect(breaker.getState()).toBe('OPEN');

      jest.advanceTimersByTime(9_999);
      expect(breaker.getState()).toBe('OPEN');

      jest.advanceTimersByTime(2);
      expect(breaker.getState()).toBe('HALF_OPEN');
    } finally {
      jest.useRealTimers();
    }
  });

  it('closes again after enough consecutive successes in HALF_OPEN', () => {
    jest.useFakeTimers();
    try {
      const breaker = new CircuitBreaker('test-close', {
        failureThreshold: 1,
        recoveryTimeoutMs: 1_000,
        halfOpenMaxSuccesses: 2,
      });
      breaker.recordFailure();
      jest.advanceTimersByTime(1_001);
      expect(breaker.getState()).toBe('HALF_OPEN');

      breaker.recordSuccess();
      expect(breaker.getState()).toBe('HALF_OPEN');
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('CLOSED');
    } finally {
      jest.useRealTimers();
    }
  });

  it('re-trips to OPEN on any failure while HALF_OPEN', () => {
    jest.useFakeTimers();
    try {
      const breaker = new CircuitBreaker('test-retrip', {
        failureThreshold: 1,
        recoveryTimeoutMs: 1_000,
      });
      breaker.recordFailure();
      jest.advanceTimersByTime(1_001);
      expect(breaker.getState()).toBe('HALF_OPEN');

      breaker.recordFailure();
      expect(breaker.getState()).toBe('OPEN');
    } finally {
      jest.useRealTimers();
    }
  });

  it('execute() records success and returns the resolved value', async () => {
    const breaker = new CircuitBreaker('test-execute-success');
    const result = await breaker.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('execute() records failure and rethrows the original error', async () => {
    const breaker = new CircuitBreaker('test-execute-failure', { failureThreshold: 5 });
    const boom = new Error('boom');
    await expect(breaker.execute(() => Promise.reject(boom))).rejects.toBe(boom);
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('dispatches a circuit-breaker-change event on every state transition', () => {
    const listener = jest.fn();
    window.addEventListener('circuit-breaker-change', listener);
    try {
      const breaker = new CircuitBreaker('test-event', { failureThreshold: 1 });
      breaker.recordFailure();
      expect(listener).toHaveBeenCalledTimes(1);
      const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
      expect(detail).toMatchObject({ name: 'test-event', from: 'CLOSED', to: 'OPEN' });
    } finally {
      window.removeEventListener('circuit-breaker-change', listener);
    }
  });
});
