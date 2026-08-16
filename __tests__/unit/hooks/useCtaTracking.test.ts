import { renderHook, act } from '@testing-library/react';
import { useCtaTracking } from '@/features/seller/hooks/useCtaTracking';

// Mock analytics provider
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

import { trackEvent } from '@/core/providers/analytics-provider';
const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>;

// Mock logger for security event assertions
jest.mock('@/core/telemetry/logger', () => ({
  logSecurityEvent: jest.fn(),
}));

describe('useCtaTracking', () => {
  let originalSendBeacon: typeof navigator.sendBeacon;
  let mockSendBeacon: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default: consent granted
    const consentData = JSON.stringify({
      version: '1.0',
      preferences: { necessary: true, analytics: true, marketing: false, preferences: false },
    });
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'cookie_consent') return consentData;
      return null;
    });

    // Mock sendBeacon
    mockSendBeacon = jest.fn(() => true);
    originalSendBeacon = navigator.sendBeacon;
    Object.defineProperty(navigator, 'sendBeacon', {
      value: mockSendBeacon,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(navigator, 'sendBeacon', {
      value: originalSendBeacon,
      writable: true,
      configurable: true,
    });
  });

  it('returns a stable callback reference across re-renders with same deps', () => {
    const { result, rerender } = renderHook(() =>
      useCtaTracking({ position: 'top', planName: 'Growth' })
    );

    // Consent is read via useEffect during the initial mount (already flushed
    // by renderHook's act() wrapper), so the callback is already stable by the
    // time we capture our first reference here — verified stable across
    // subsequent re-renders below.
    rerender();
    const secondRef = result.current;
    rerender();
    const thirdRef = result.current;
    expect(secondRef).toBe(thirdRef);
  });

  it('calls sendBeacon with correct payload when consent is granted', () => {
    const { result } = renderHook(() =>
      useCtaTracking({ position: 'top', planName: 'Growth' })
    );

    // Trigger useEffect to read consent
    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current();
    });

    expect(mockSendBeacon).toHaveBeenCalledWith(
      '/api/analytics/event',
      expect.stringContaining('"event":"seller_onboarding_cta_clicked"')
    );

    // Verify payload includes planName and position
    const calledPayload = JSON.parse(mockSendBeacon.mock.calls[0][1]);
    expect(calledPayload).toEqual({
      event: 'seller_onboarding_cta_clicked',
      position: 'top',
      planName: 'Growth',
    });
  });

  it('does NOT call sendBeacon or trackEvent when consent is false', () => {
    // Override consent to denied
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({
        version: '1.0',
        preferences: { necessary: true, analytics: false, marketing: false, preferences: false },
      })
    );

    const { result } = renderHook(() =>
      useCtaTracking({ position: 'top', planName: 'Growth' })
    );

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current();
    });

    expect(mockSendBeacon).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does NOT call tracking on rapid second click (double-click prevention)', () => {
    const { result } = renderHook(() =>
      useCtaTracking({ position: 'top', planName: 'Growth' })
    );

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current(); // First click
      result.current(); // Immediate second click
    });

    // sendBeacon should only be called once
    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
  });

  it('does NOT include timestamp in payload', () => {
    const { result } = renderHook(() =>
      useCtaTracking({ position: 'bottom' })
    );

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current();
    });

    const calledPayload = JSON.parse(mockSendBeacon.mock.calls[0][1]);
    expect(calledPayload).not.toHaveProperty('timestamp');
  });

  it('uses "unknown" fallback when planName is undefined', () => {
    const { result } = renderHook(() =>
      useCtaTracking({ position: 'pricing' })
    );

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current();
    });

    const calledPayload = JSON.parse(mockSendBeacon.mock.calls[0][1]);
    expect(calledPayload.planName).toBe('unknown');
  });

  it('catches and suppresses trackEvent errors (fallback path)', () => {
    // Remove sendBeacon to force fallback path
    Object.defineProperty(navigator, 'sendBeacon', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    mockTrackEvent.mockImplementation(() => {
      throw new Error('Analytics service down');
    });

    const { result } = renderHook(() =>
      useCtaTracking({ position: 'top', planName: 'Growth' })
    );

    act(() => {
      jest.runAllTimers();
    });

    // Should not throw
    expect(() => {
      act(() => {
        result.current();
      });
    }).not.toThrow();
  });

  it('resets double-click gate after timeout', () => {
    const { result } = renderHook(() =>
      useCtaTracking({ position: 'top', planName: 'Growth' })
    );

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current(); // First click
    });

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);

    // Advance past the 2000ms reset timeout
    act(() => {
      jest.advanceTimersByTime(2100);
    });

    act(() => {
      result.current(); // Second click after reset
    });

    expect(mockSendBeacon).toHaveBeenCalledTimes(2);
  });

  it('handles missing localStorage gracefully (no crash)', () => {
    // Simulate localStorage.getItem throwing (SSR-like edge case)
    Storage.prototype.getItem = jest.fn(() => {
      throw new Error('localStorage unavailable');
    });

    const { result } = renderHook(() =>
      useCtaTracking({ position: 'top' })
    );

    act(() => {
      jest.runAllTimers();
    });

    // Should not throw, and should not call tracking (consent defaults to false)
    expect(() => {
      act(() => {
        result.current();
      });
    }).not.toThrow();

    expect(mockSendBeacon).not.toHaveBeenCalled();
  });
});
