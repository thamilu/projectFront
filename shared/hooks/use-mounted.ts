'use client';

import { useEffect, useState } from 'react';

/**
 * useMounted Hook
 * 
 * Prevents hydration mismatches by ensuring client-only code runs only after mounting.
 * Useful for auth states, window APIs, or dynamic rendering based on browser storage.
 * 
 * @returns {boolean} True if the component has mounted on the client.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
