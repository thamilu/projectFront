import { useMemo } from 'react';

import type { AddressFieldNames } from '../address.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_PREFIX = '';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Derives all address field names by applying an optional prefix.
 *
 * @param namePrefix - Optional prefix (e.g. `"store"` → `"storeCity"`).
 * @returns A stable `AddressFieldNames` record that only recomputes when the prefix changes.
 *
 * @example
 * ```ts
 * const fields = useFieldNames('store');
 * // fields.city      → 'storeCity'
 * // fields.pincode   → 'storePincode'
 * ```
 */
export function useFieldNames(namePrefix: string = EMPTY_PREFIX): AddressFieldNames {
  return useMemo(() => {
    const prefix = (name: string): string => {
      if (!namePrefix) return name;
      return `${namePrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    };

    return {
      addressLine1: prefix('addressLine1'),
      addressLine2: prefix('addressLine2'),
      city: prefix('city'),
      state: prefix('state'),
      district: prefix('district'),
      taluk: prefix('taluk'),
      pincode: prefix('pincode'),
      country: prefix('country'),
    };
  }, [namePrefix]);
}
