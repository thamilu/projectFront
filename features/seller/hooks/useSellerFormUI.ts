'use client';

import { useContext } from 'react';
import { SellerFormUIContext } from '../contexts/SellerFormUIContext';

/**
 * Access seller form UI state (edit modes, collapsed sections, etc.)
 *
 * @throws {Error} If used outside SellerFormUIProvider
 */
export function useSellerFormUI() {
  const context = useContext(SellerFormUIContext);

  if (!context) {
    throw new Error(
      'useSellerFormUI must be used within SellerFormUIProvider. ' +
        'Wrap your component tree with <SellerFormUIProvider>.'
    );
  }

  return context;
}
export default useSellerFormUI;
