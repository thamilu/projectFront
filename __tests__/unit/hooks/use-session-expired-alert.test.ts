import { renderHook, act } from '@testing-library/react';
import { useSessionExpiredAlert } from '@/features/auth/hooks/use-session-expired-alert';

describe('useSessionExpiredAlert', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize showMessage with the sessionExpired parameter', () => {
    const { result } = renderHook(() => useSessionExpiredAlert(true));
    expect(result.current.showMessage).toBe(true);

    const { result: result2 } = renderHook(() => useSessionExpiredAlert(false));
    expect(result2.current.showMessage).toBe(false);
  });

  it('does NOT auto-dismiss by default — regression test for the real bug this fixed', () => {
    // app/(auth)/login/page.tsx's OTHER status alert only shows for
    // `isAuthError && !sessionExpired` — while sessionExpired stays true
    // (the whole time on /login?error=SessionExpired), nothing takes this
    // alert's place once it disappears. Auto-dismissing by default left
    // the user with no visible explanation at all after 5s.
    const { result } = renderHook(() => useSessionExpiredAlert(true));
    expect(result.current.showMessage).toBe(true);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current.showMessage).toBe(true);
  });

  it('auto-dismisses after autoDismissMs when explicitly opted in', () => {
    const { result } = renderHook(() => useSessionExpiredAlert(true, { autoDismissMs: 5000 }));
    expect(result.current.showMessage).toBe(true);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.showMessage).toBe(false);
  });

  it('should allow manual dismiss using dismiss callback', () => {
    const { result } = renderHook(() => useSessionExpiredAlert(true));
    expect(result.current.showMessage).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.showMessage).toBe(false);
  });

  it('should sync state when sessionExpired prop changes', () => {
    const { result, rerender } = renderHook(
      ({ sessionExpired }) => useSessionExpiredAlert(sessionExpired),
      {
        initialProps: { sessionExpired: false },
      }
    );

    expect(result.current.showMessage).toBe(false);

    rerender({ sessionExpired: true });
    expect(result.current.showMessage).toBe(true);
  });
});
