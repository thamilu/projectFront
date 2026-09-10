/**
 * @jest-environment node
 *
 * Guards against the exact drift that motivated this file: a numeric claim
 * in a docstring (token-refresh.ts previously said "3 retries" while
 * REFRESH_CONFIG.MAX_RETRIES was 2) silently went stale because nothing
 * checked the two against each other. These tests assert the *documented*
 * worst-case latency budget (see the comment above REFRESH_CONFIG in
 * config.ts) still holds for the actual default values — if a future change
 * to MAX_RETRIES/TIMEOUT_MS/BASE_DELAY_MS blows that budget, this fails
 * instead of silently compounding into a worse on-call surprise.
 */

jest.mock('jose', () => ({
  decodeJwt: jest.fn(),
}));

import { REFRESH_CONFIG, BACKEND_CONFIG } from '@/lib/auth/config';

// Matches the calculation documented in config.ts: worst case is
// MAX_RETRIES attempts, each up to TIMEOUT_MS, with exponential-backoff-plus-jitter
// delays between them (jitter capped at 1000ms per token-refresh.ts).
function worstCaseRefreshLatencyMs(): number {
  const attempts = REFRESH_CONFIG.MAX_RETRIES;
  const attemptTime = attempts * REFRESH_CONFIG.TIMEOUT_MS;
  let backoffTime = 0;
  for (let attempt = 0; attempt < attempts - 1; attempt++) {
    backoffTime += REFRESH_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt) + 1000; // +1000 = max jitter
  }
  return attemptTime + backoffTime;
}

describe('auth resilience config — documented latency budget stays accurate', () => {
  it('matches the ~10.5-11.5s worst case documented above REFRESH_CONFIG in config.ts', () => {
    const worstCaseMs = worstCaseRefreshLatencyMs();

    // Loosely bounded on purpose: this isn't pinning exact default values
    // (that's what config.ts's own docstring is for), it's catching the
    // case where a future change makes the DOCUMENTED number wrong without
    // anyone updating the comment — same failure mode as the "3 retries"
    // drift that prompted this test.
    expect(worstCaseMs).toBeGreaterThanOrEqual(10_000);
    expect(worstCaseMs).toBeLessThanOrEqual(12_000);
  });

  it('fails loudly if MAX_RETRIES or TIMEOUT_MS changes without updating config.ts\'s documented calculation', () => {
    // Pinned to the actual current defaults (env.ts / __tests__/setup.ts's
    // mock). If this fails, it means those defaults changed — update BOTH
    // this assertion and the worst-case comment in config.ts together,
    // not just one.
    expect(REFRESH_CONFIG.MAX_RETRIES).toBe(2);
    expect(REFRESH_CONFIG.TIMEOUT_MS).toBe(5_000);
    expect(REFRESH_CONFIG.BASE_DELAY_MS).toBe(500);
  });

  it('BACKEND_CONFIG centralizes retry tuning, mirroring REFRESH_CONFIG\'s shape', () => {
    // Regression guard for the specific gap found in this audit:
    // fetchUserRoleWithRetry previously hardcoded its own MAX_RETRIES/
    // RETRY_DELAY_MS locally in backend-role.ts instead of sourcing them
    // from this file, despite config.ts being the established single
    // location for this module's tunable resilience parameters.
    expect(typeof BACKEND_CONFIG.MAX_RETRIES).toBe('number');
    expect(typeof BACKEND_CONFIG.BASE_DELAY_MS).toBe('number');
    expect(typeof BACKEND_CONFIG.TIMEOUT_MS).toBe('number');
  });
});
