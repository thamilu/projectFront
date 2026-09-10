import * as React from 'react';

/**
 * useMergedRef — Stable callback ref that forwards to multiple refs.
 *
 * Uses useCallback with refs as deps. Since refs spread into an array,
 * the eslint exhaustive-deps rule is suppressed intentionally.
 * Ref objects (useRef) are stable by contract; ForwardedRef functions
 * change only when the parent re-renders with a new inline ref.
 *
 * @param refs - Any mix of callback refs, ref objects, null, or undefined
 * @returns A stable RefCallback that populates all provided refs
 */
export function useMergedRef<T extends Element>(
  ...refs: Array<React.ForwardedRef<T> | React.RefObject<T> | null | undefined>
): React.RefCallback<T> {
  return React.useCallback(
    (node: T | null) => {
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = node;
        }
      });
    },
    // refs spread is intentionally used as deps.
    // String comparison of array contents is stable for ref objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}
