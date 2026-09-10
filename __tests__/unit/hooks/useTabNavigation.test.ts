import { renderHook, act } from '@testing-library/react';
import { useTabNavigation } from '@/features/users/hooks/useTabNavigation';
import { PROFILE_TABS } from '@/features/users/utils/profile.constants';

describe('useTabNavigation', () => {
  it('initializes with default tab', () => {
    const { result } = renderHook(() => useTabNavigation());
    expect(result.current.activeTab).toBe(PROFILE_TABS.PERSONAL);
  });

  it('validates initial tab and falls back to first tab', () => {
    const { result } = renderHook(() => useTabNavigation({ initial: 'INVALID' as any }));
    expect(result.current.activeTab).toBe(PROFILE_TABS.PERSONAL); // First in TAB_ORDER
  });

  it('navigates forward', () => {
    const { result } = renderHook(() => useTabNavigation());
    act(() => {
      result.current.goNext();
    });
    expect(result.current.activeTab).toBe(PROFILE_TABS.ADDRESS); // Second tab in TAB_ORDER
  });

  it('does not go beyond last tab', () => {
    const { result } = renderHook(
      () => useTabNavigation({ initial: PROFILE_TABS.ADDRESS }) // Last tab
    );
    const lastTab = result.current.activeTab;
    act(() => {
      result.current.goNext();
    });
    expect(result.current.activeTab).toBe(lastTab); // Unchanged
  });

  it('calls onTabChange with correct arguments', () => {
    const onTabChange = jest.fn();
    const { result } = renderHook(() => useTabNavigation({ onTabChange }));
    act(() => {
      result.current.goNext();
    });
    expect(onTabChange).toHaveBeenCalledWith(PROFILE_TABS.PERSONAL, PROFILE_TABS.ADDRESS, 'next');
  });

  it('rejects invalid tabs in setTab', () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() => useTabNavigation());
    act(() => {
      result.current.setTab('INVALID' as any);
    });
    expect(result.current.activeTab).toBe(PROFILE_TABS.PERSONAL); // Unchanged
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
    (process.env as any).NODE_ENV = originalEnv;
  });
});
