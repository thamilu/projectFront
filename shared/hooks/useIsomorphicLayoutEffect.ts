import { useEffect, useLayoutEffect } from 'react';

/**
 * SSR-safe version of useLayoutEffect.
 * Falls back to useEffect on the server to prevent hydration warnings.
 * @see https://react.dev/reference/react/useLayoutEffect#usage
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
