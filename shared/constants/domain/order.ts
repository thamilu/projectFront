import { components } from '@/shared/types/generated/api';

type RawOrderStatus = NonNullable<components['schemas']['TrackingUpdateRequest']['status']>;

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  LOST: 'LOST',
  DAMAGED: 'DAMAGED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Compile-time assertion checking that ORDER_STATUS aligns with OpenAPI RawOrderStatus
const _orderStatusCheck: Record<OrderStatus, RawOrderStatus> = {
  PENDING: 'PENDING',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  LOST: 'LOST',
  DAMAGED: 'DAMAGED',
};
