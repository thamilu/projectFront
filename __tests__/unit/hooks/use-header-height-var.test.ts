// ============================================================
// __tests__/unit/hooks/use-header-height-var.test.ts
// The sticky header's real height varies (promo bar present/absent,
// wraps on narrow viewports) — this hook must publish the CURRENT
// measured height as --header-height, not a one-time snapshot, since
// app/styles/base.css's `scroll-padding-top: var(--header-height)`
// depends on it staying accurate to keep anchor/skip-link targets from
// landing underneath the fixed header.
// ============================================================

import { renderHook } from '@testing-library/react';
import { useHeaderHeightVar } from '@/shared/ui/layout/header/hooks/use-header-height-var';

describe('useHeaderHeightVar', () => {
  let observeSpy: jest.Mock;
  let disconnectSpy: jest.Mock;
  let capturedCallback: ResizeObserverCallback | null;

  beforeEach(() => {
    document.documentElement.style.removeProperty('--header-height');
    observeSpy = jest.fn();
    disconnectSpy = jest.fn();
    capturedCallback = null;

    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        capturedCallback = cb;
      }
      observe = observeSpy;
      unobserve = jest.fn();
      disconnect = disconnectSpy;
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  function makeHeaderRef(initialHeight: number) {
    const node = document.createElement('header');
    jest.spyOn(node, 'getBoundingClientRect').mockReturnValue({ height: initialHeight } as DOMRect);
    return { current: node };
  }

  it('publishes the initial measured height as --header-height on mount', () => {
    const ref = makeHeaderRef(96);

    renderHook(() => useHeaderHeightVar(ref));

    expect(document.documentElement.style.getPropertyValue('--header-height')).toBe('96px');
    expect(observeSpy).toHaveBeenCalledWith(ref.current);
  });

  it('updates --header-height when the header resizes (e.g. promo bar wraps to a second line)', () => {
    const ref = makeHeaderRef(96);
    renderHook(() => useHeaderHeightVar(ref));

    capturedCallback?.(
      [{ contentRect: { height: 140 }, borderBoxSize: [] } as unknown as ResizeObserverEntry],
      {} as ResizeObserver
    );

    expect(document.documentElement.style.getPropertyValue('--header-height')).toBe('140px');
  });

  it('does nothing when the ref is not yet attached to a DOM node', () => {
    renderHook(() => useHeaderHeightVar({ current: null }));
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('disconnects the observer on unmount', () => {
    const ref = makeHeaderRef(96);
    const { unmount } = renderHook(() => useHeaderHeightVar(ref));

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
