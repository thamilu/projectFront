import { getAppConfig } from '@/shared/config/app-config';

export const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const PRICE_RANGE = {
  MIN: 0,
  MAX: 1000000,
  get CURRENCY(): string {
    return getAppConfig().defaultCurrency;
  },
  get CURRENCY_SYMBOL(): string {
    return getAppConfig().defaultCurrencySymbol;
  },
} as const;

export const RATING = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 0,
} as const;

export const INVENTORY = {
  LOW_STOCK_THRESHOLD: 10,
  OUT_OF_STOCK: 0,
} as const;
