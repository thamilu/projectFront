import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TAB_ORDER, PROFILE_TABS, type ProfileTab } from '../utils/profile.constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TabNavigationState {
  readonly activeTab: ProfileTab;
  readonly setTab: (tab: ProfileTab) => void;
  readonly canGoNext: boolean;
  readonly canGoBack: boolean;
  readonly goNext: () => void;
  readonly goBack: () => void;
}

export interface UseTabNavigationOptions {
  readonly initial?: ProfileTab;
  readonly onTabChange?: (
    from: ProfileTab,
    to: ProfileTab,
    method: 'next' | 'back' | 'direct'
  ) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook for managing tab navigation state in multi-step forms.
 *
 * Provides navigation controls (next/back), boundary checks, and direct tab access.
 * Tab order is defined by TAB_ORDER constant. Navigation is bounded — cannot go
 * beyond first/last tab.
 *
 * Pure state/navigation only — keyboard handling and ARIA tab/tablist props
 * are NOT provided here. The one consumer (ProfileForm.tsx) renders tabs via
 * Radix's `Tabs` primitive, which already implements the full WAI-ARIA Tabs
 * keyboard pattern (arrows/Home/End) and role/aria-selected wiring itself;
 * duplicating that here would be a second, unused implementation of the same
 * behavior. Reintroduce those helpers only for a consumer that renders tabs
 * without Radix.
 *
 * Features:
 * - ✅ Truly stable callbacks (no dependencies on parent props via ref pattern)
 * - ✅ Tab change telemetry hook (NOTE: May fire rapidly on quick user navigation)
 * - ✅ Validation of tab values
 *
 * @param options - Configuration options
 * @param options.initial - Starting tab (default: PROFILE_TABS.PERSONAL)
 * @param options.onTabChange - Optional callback fired on tab transitions
 *
 * @returns Navigation state and controls
 *
 * @example
 * Basic usage:
 * ```tsx
 * const nav = useTabNavigation({
 *   initial: PROFILE_TABS.PERSONAL,
 *   onTabChange: (from, to, method) => analytics.track('tab_change', { from, to, method }),
 * });
 *
 * return <Tabs value={nav.activeTab} onValueChange={nav.setTab}>...</Tabs>;
 * ```
 *
 * @example
 * Testing:
 * ```tsx
 * import { renderHook, act } from '@testing-library/react';
 * import { useTabNavigation } from './useTabNavigation';
 * import { PROFILE_TABS } from '../utils/profile.constants';
 *
 * test('navigates to next tab', () => {
 *   const { result } = renderHook(() => useTabNavigation());
 *   act(() => { result.current.goNext(); });
 *   expect(result.current.activeTab).toBe(PROFILE_TABS.ADDRESS);
 * });
 * ```
 */
export function useTabNavigation(options: UseTabNavigationOptions = {}): TabNavigationState {
  const { initial = PROFILE_TABS.PERSONAL, onTabChange } = options;

  // ── Stable ref for onTabChange (prevents callback recreation) ────────────
  const onTabChangeRef = useRef(onTabChange);

  useEffect(() => {
    onTabChangeRef.current = onTabChange;
  }, [onTabChange]);

  // ── State ─────────────────────────────────────────────────────────────────
  // Validate initial tab
  const validatedInitial = TAB_ORDER.includes(initial) ? initial : TAB_ORDER[0];

  const [activeTab, setActiveTab] = useState<ProfileTab>(validatedInitial);

  // ── Derived state (no memoization needed for trivial computations) ────────
  const currentIndex = TAB_ORDER.indexOf(activeTab);
  const canGoNext = currentIndex < TAB_ORDER.length - 1;
  const canGoBack = currentIndex > 0;

  // ── Validated setter (truly stable — no deps) ─────────────────────────────
  const setTab = useCallback((tab: ProfileTab) => {
    if (!TAB_ORDER.includes(tab)) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[useTabNavigation] Invalid tab "${tab}". Must be one of:`, TAB_ORDER);
      }
      return;
    }

    setActiveTab((prev) => {
      if (prev === tab) return prev; // No-op if same tab
      onTabChangeRef.current?.(prev, tab, 'direct'); // Use ref — always current
      return tab;
    });
  }, []); // ✅ Empty deps — truly stable

  // ── Navigation callbacks (truly stable — no deps) ─────────────────────────
  const goNext = useCallback(() => {
    setActiveTab((current) => {
      const idx = TAB_ORDER.indexOf(current);
      if (idx >= TAB_ORDER.length - 1) return current;
      const next = TAB_ORDER[idx + 1];
      onTabChangeRef.current?.(current, next, 'next');
      return next;
    });
  }, []); // ✅ Empty deps — truly stable

  const goBack = useCallback(() => {
    setActiveTab((current) => {
      const idx = TAB_ORDER.indexOf(current);
      if (idx <= 0) return current;
      const prev = TAB_ORDER[idx - 1];
      onTabChangeRef.current?.(current, prev, 'back');
      return prev;
    });
  }, []); // ✅ Empty deps — truly stable

  // ── Memoized return object ────────────────────────────────────────────────
  // Only include primitives in deps. Exclude all callbacks and stable functions
  // to avoid redundant comparisons and guarantee complete reference stability.
  return useMemo(
    () =>
      ({
        activeTab,
        setTab,
        canGoNext,
        canGoBack,
        goNext,
        goBack,
      }) satisfies TabNavigationState,
    [activeTab, canGoNext, canGoBack, setTab, goNext, goBack]
  );
}
