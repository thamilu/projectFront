/**
 * Shop-handle availability check.
 *
 * Every test here corresponds to a defect that shipped in the inline
 * `useEffect` this hook replaced. The headline one: an invalid handle threw
 * `PathSegmentError` out of the URL builder, into a `catch` that assumed HTTP
 * errors, producing `Handle check failed [undefined]: "Handle verification
 * failed"` in the console — a message that named neither the real problem nor
 * anything the seller could act on.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useHandleAvailability } from '@/features/seller/hooks/use-handle-availability';
import { AppError } from '@/core/http/errors';
import { apiClient } from '@/core/client';
import { logger } from '@/core/telemetry/logger';

jest.mock('@/core/client', () => ({
  apiClient: { get: jest.fn() },
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockGet = apiClient.get as jest.Mock;
const mockWarn = logger.warn as jest.Mock;

/** Backend envelope: `{ success, message, data }`, with `data` the boolean. */
const envelope = (available: boolean) => ({ data: { data: available } });

/** Advance past the debounce and let the pending promise settle. */
async function flushDebounce(ms = 600) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useHandleAvailability — resting states', () => {
  it('starts idle and issues no request for an empty handle', () => {
    const { result } = renderHook(() => useHandleAvailability(''));

    expect(result.current.status).toBe('IDLE');
    expect(result.current.message).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('treats undefined as idle rather than crashing', () => {
    const { result } = renderHook(() => useHandleAvailability(undefined));
    expect(result.current.status).toBe('IDLE');
  });

  it('does nothing while disabled, and clears any prior verdict', async () => {
    mockGet.mockResolvedValue(envelope(true));

    const { result, rerender } = renderHook(
      ({ enabled }) => useHandleAvailability('acme-store', { enabled }),
      { initialProps: { enabled: true } }
    );

    await flushDebounce();
    expect(result.current.status).toBe('AVAILABLE');

    // A stale "available" tick left on screen while the form is submitting
    // would be asserting something the hook is no longer checking.
    rerender({ enabled: false });
    expect(result.current.status).toBe('IDLE');
  });
});

describe('useHandleAvailability — invalid handles never reach the network', () => {
  // The reported bug. `API_ENDPOINTS.SELLER.CHECK_HANDLE()` throws
  // PathSegmentError for these, and that throw used to be reported as a failed
  // verification.
  it.each([
    ['ab', 'Handle must be at least 3 characters'],
    ['my.shop', 'Only lowercase letters, numbers, and hyphens allowed'],
    ['My_Shop', 'Only lowercase letters, numbers, and hyphens allowed'],
    ['a'.repeat(51), 'Handle cannot exceed 50 characters'],
  ])('reports %p as INVALID with a specific reason', async (handle, expected) => {
    const { result } = renderHook(() => useHandleAvailability(handle));

    await flushDebounce();

    expect({ status: result.current.status, message: result.current.message }).toEqual({
      status: 'INVALID',
      message: expected,
    });
    expect(mockGet).not.toHaveBeenCalled();
    // And it is not an error — nothing failed, so nothing is logged.
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('useHandleAvailability — successful checks', () => {
  it('reports AVAILABLE for a free handle', async () => {
    mockGet.mockResolvedValue(envelope(true));

    const { result } = renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    expect(result.current.status).toBe('AVAILABLE');
    expect(result.current.message).toBeNull();
  });

  it('reports TAKEN with an explanation', async () => {
    mockGet.mockResolvedValue(envelope(false));

    const { result } = renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    expect(result.current.status).toBe('TAKEN');
    expect(result.current.message).toBe('This handle is already taken');
  });

  it('sends the ambient-request header so a failure raises no global toast', async () => {
    mockGet.mockResolvedValue(envelope(true));

    renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/sellers/check-handle/acme-store'),
      expect.objectContaining({ headers: { 'X-Bypass-Toast': 'true' } })
    );
  });

  it('trims before checking, so a stray space is not a format error', async () => {
    mockGet.mockResolvedValue(envelope(true));

    renderHook(() => useHandleAvailability('  acme-store  '));
    await flushDebounce();

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/sellers/check-handle/acme-store'),
      expect.anything()
    );
  });
});

describe('useHandleAvailability — debouncing', () => {
  it('issues one request for a burst of keystrokes', async () => {
    mockGet.mockResolvedValue(envelope(true));

    const { rerender } = renderHook(({ handle }) => useHandleAvailability(handle), {
      initialProps: { handle: 'acm' },
    });

    for (const handle of ['acme', 'acme-', 'acme-s', 'acme-store']) {
      rerender({ handle });
      act(() => {
        jest.advanceTimersByTime(100);
      });
    }

    await flushDebounce();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/sellers/check-handle/acme-store'),
      expect.anything()
    );
  });

  it('honours a configured debounce window', async () => {
    mockGet.mockResolvedValue(envelope(true));

    renderHook(() => useHandleAvailability('acme-store', { debounceMs: 2000 }));

    await flushDebounce(1000);
    expect(mockGet).not.toHaveBeenCalled();

    await flushDebounce(1500);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe('useHandleAvailability — failures', () => {
  it('logs the real status, code and backend message instead of a placeholder', async () => {
    // The precise regression. AppError is what the response interceptor throws;
    // it has no `.response`, so the old `'response' in error` check matched
    // nothing and logged `[undefined]: "Handle verification failed"` — throwing
    // away all three facts asserted here.
    mockGet.mockRejectedValue(
      new AppError(503, 'SERVICE_UNAVAILABLE', 'Seller service is temporarily unavailable')
    );

    const { result } = renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    await waitFor(() => expect(mockWarn).toHaveBeenCalled());

    expect(mockWarn).toHaveBeenCalledWith(
      '[seller] Shop handle availability check failed',
      expect.objectContaining({
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
        error: 'Seller service is temporarily unavailable',
      })
    );
    expect(result.current.status).toBe('ERROR');
  });

  it('never blocks the seller when the check itself fails', async () => {
    mockGet.mockRejectedValue(new AppError(500, 'INTERNAL_SERVER_ERROR', 'boom'));

    const { result } = renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    // ERROR, not TAKEN: the service being down is not evidence the handle is
    // in use, and uniqueness is re-validated server-side on submit anyway.
    expect(result.current.status).toBe('ERROR');
    expect(result.current.message).toBeNull();
  });

  it('does not accuse the seller when the payload is not a boolean', async () => {
    // Regression: `response.data?.data === true` treated an HTML error page, a
    // proxy interstitial or a changed envelope as "false" — i.e. "This handle
    // is already taken" — blocking the seller behind a verdict the backend
    // never actually gave.
    mockGet.mockResolvedValue({ data: { data: '<html>502 Bad Gateway</html>' } });

    const { result } = renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    expect(result.current.status).toBe('ERROR');
    expect(result.current.status).not.toBe('TAKEN');
  });

  it('treats an abort as a non-event — no log, no state change', async () => {
    mockGet.mockRejectedValue(Object.assign(new Error('canceled'), { name: 'CanceledError' }));

    const { result } = renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    expect(mockWarn).not.toHaveBeenCalled();
    expect(result.current.status).toBe('IDLE');
  });
});

describe('useHandleAvailability — lifecycle', () => {
  it('aborts the in-flight request on unmount', async () => {
    let capturedSignal: AbortSignal | undefined;
    mockGet.mockImplementation((_url: string, config: { signal: AbortSignal }) => {
      capturedSignal = config.signal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useHandleAvailability('acme-store'));
    await flushDebounce();

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('cancels every timer it created when unmounted', async () => {
    // The spinner's trailing delay used to be an unreferenced setTimeout that
    // fired after unmount, updating state on a component that was gone.
    //
    // Asserted against the timers this hook itself creates rather than
    // `jest.getTimerCount()`: the test environment keeps ambient timers of its
    // own, so a global count would be measuring something else and would pass
    // or fail for reasons unrelated to the leak.
    mockGet.mockResolvedValue(envelope(true));

    const setSpy = jest.spyOn(global, 'setTimeout');
    const clearSpy = jest.spyOn(global, 'clearTimeout');

    try {
      const { unmount } = renderHook(() => useHandleAvailability('acme-store'));
      await flushDebounce();

      // The debounce (500ms) and the spinner floor (300ms) are the two the hook
      // schedules; both must exist before the cancellation claim means anything.
      const ownTimerIds = setSpy.mock.calls
        .map((call, index) => ({ delay: call[1], id: setSpy.mock.results[index]?.value }))
        .filter(({ delay }) => delay === 500 || delay === 300)
        .map(({ id }) => id);

      expect(ownTimerIds).toHaveLength(2);

      unmount();

      const clearedIds = clearSpy.mock.calls.map((call) => call[0]);
      expect(ownTimerIds.filter((id) => !clearedIds.includes(id))).toEqual([]);
    } finally {
      setSpy.mockRestore();
      clearSpy.mockRestore();
    }
  });

  it('a slow first response cannot overwrite a newer verdict', async () => {
    // Ordering matters more than speed here: the first request resolves last.
    let resolveFirst: ((value: unknown) => void) | undefined;
    mockGet
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValue(envelope(false));

    const { result, rerender } = renderHook(({ handle }) => useHandleAvailability(handle), {
      initialProps: { handle: 'first-handle' },
    });

    await flushDebounce();

    rerender({ handle: 'second-handle' });
    await flushDebounce();

    expect(result.current.status).toBe('TAKEN');

    // The superseded request now answers "available" — for a handle nobody is
    // looking at any more.
    await act(async () => {
      resolveFirst?.(envelope(true));
      await Promise.resolve();
    });

    expect(result.current.status).toBe('TAKEN');
  });
});
