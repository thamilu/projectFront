import { renderHook, act } from '@testing-library/react';
import { useEditState } from '@/features/users/hooks/useEditState';

function dispatchBeforeUnload(): { preventDefault: jest.Mock } {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
  const preventDefault = jest.fn();
  // BeforeUnloadEvent.preventDefault isn't otherwise spy-able in jsdom.
  (event as unknown as { preventDefault: jest.Mock }).preventDefault = preventDefault;
  window.dispatchEvent(event);
  return { preventDefault };
}

describe('useEditState', () => {
  it('starts not editing', () => {
    const { result } = renderHook(() => useEditState(false, jest.fn()));
    expect(result.current.isEditing).toBe(false);
  });

  it('handleEdit enters edit mode', () => {
    const { result } = renderHook(() => useEditState(false, jest.fn()));
    act(() => result.current.handleEdit());
    expect(result.current.isEditing).toBe(true);
  });

  it('handleCancel resets the form and exits edit mode', () => {
    const reset = jest.fn();
    const { result } = renderHook(() => useEditState(true, reset));
    act(() => result.current.handleEdit());
    act(() => result.current.handleCancel());
    expect(reset).toHaveBeenCalledTimes(1);
    expect(result.current.isEditing).toBe(false);
  });

  it('handleReset resets the form but stays in edit mode', () => {
    const reset = jest.fn();
    const { result } = renderHook(() => useEditState(true, reset));
    act(() => result.current.handleEdit());
    act(() => result.current.handleReset());
    expect(reset).toHaveBeenCalledTimes(1);
    expect(result.current.isEditing).toBe(true);
  });

  it('closeEdit exits edit mode without resetting the form', () => {
    const reset = jest.fn();
    const { result } = renderHook(() => useEditState(true, reset));
    act(() => result.current.handleEdit());
    act(() => result.current.closeEdit());
    expect(reset).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  // Regression coverage for the beforeunload browser guard this hook's own
  // docstring claims to own exclusively ("ProfileForm delegates this
  // entirely") — previously untested from either location, since a
  // duplicate copy also lived in ProfileForm.tsx itself.
  describe('beforeunload guard', () => {
    it('does not warn when clean and not editing', () => {
      renderHook(() => useEditState(false, jest.fn()));
      const { preventDefault } = dispatchBeforeUnload();
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('does not warn when dirty but not in edit mode', () => {
      renderHook(() => useEditState(true, jest.fn()));
      const { preventDefault } = dispatchBeforeUnload();
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('does not warn when editing but not dirty', () => {
      const { result } = renderHook(() => useEditState(false, jest.fn()));
      act(() => result.current.handleEdit());
      const { preventDefault } = dispatchBeforeUnload();
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('warns when dirty and in edit mode', () => {
      const { result } = renderHook(() => useEditState(true, jest.fn()));
      act(() => result.current.handleEdit());
      const { preventDefault } = dispatchBeforeUnload();
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('removes the listener on unmount, so it no longer fires', () => {
      const { result, unmount } = renderHook(() => useEditState(true, jest.fn()));
      act(() => result.current.handleEdit());
      unmount();
      const { preventDefault } = dispatchBeforeUnload();
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});
