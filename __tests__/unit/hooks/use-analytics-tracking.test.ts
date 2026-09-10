import { renderHook } from '@testing-library/react';
import { useAnalyticsTracking } from '@/shared/hooks/use-app-integrations';
import { logger } from '@/core/telemetry/logger';

jest.mock('@/core/telemetry/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Regression: trackPurchase previously wrote to
// features/analytics/store/analytics-store.ts — a persisted Zustand store
// whose spending/budget/category data had zero UI consumers anywhere in
// the app (confirmed via full-codebase search) — so every call silently
// accumulated data in localStorage that nothing ever displayed. That store
// has been deleted; trackPurchase now logs the call as a real, observable
// side effect instead, while the external window.trackPurchase bridge
// (see core/providers/app-integrations-initializer.tsx) keeps working.
describe('useAnalyticsTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs the tracked purchase instead of writing to the removed analytics store', () => {
    const { result } = renderHook(() => useAnalyticsTracking());

    result.current.trackPurchase(499, 'Electronics');

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Purchase tracked'),
      expect.objectContaining({ amount: 499, category: 'Electronics' })
    );
  });

  it('returns a stable trackPurchase reference across renders', () => {
    const { result, rerender } = renderHook(() => useAnalyticsTracking());
    const first = result.current.trackPurchase;
    rerender();
    expect(result.current.trackPurchase).toBe(first);
  });
});
