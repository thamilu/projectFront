/**
 * Business Constants
 * E-commerce specific constants
 */

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
} as const;

export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  DELIVERY: 'DELIVERY_AGENT',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZES: [10, 20, 50, 100],
} as const;

export const PRICE_RANGE = {
  MIN: 0,
  MAX: 1000000,
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
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

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PRODUCT_PRICE: 0.01,
  MAX_PRODUCT_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_REVIEW_LENGTH: 1000,
} as const;

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGES_PER_PRODUCT: 5,
} as const;
