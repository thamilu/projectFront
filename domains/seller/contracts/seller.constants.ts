/**
 * seller.constants.ts
 *
 * Domain-level constants for seller roles and profiles status.
 */

export const SELLER_ROLE = 'SELLER' as const;

export const SELLER_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;
