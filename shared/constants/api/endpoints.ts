import { getApiRuntimeConfig } from '@/shared/config/api-runtime.config';
import {
  validateId,
  validateSlug,
  validateHandle,
  validateAlphanumeric,
} from '@/shared/utils/path-safety';

/**
 * Branded type for type-safe routing.
 * Ensures string parameters are validated paths.
 */
export type ApiPath = string & { readonly __brand: 'ApiPath' };

/**
 * Shared canonical path constants to prevent DRY violations.
 */
const USER_ME_PATH = '/users/me';
const PRODUCTS_BASE = '/products';

/**
 * Helper to construct versioned API paths dynamically.
 * @param path The versionless subpath, e.g. '/auth/login'
 */
const v = (path: string): ApiPath => {
  const version = getApiRuntimeConfig().version;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/api/${version}${cleanPath}` as ApiPath;
};

/**
 * Helper to construct raw (unversioned) API paths for webhooks and Server-Sent Events (SSE).
 * @param path The full unversioned path, e.g. '/api/webhooks/stripe'
 */
const rawApiPath = (path: string): ApiPath => {
  return path as ApiPath;
};

/**
 * API Constants
 * Centralized API endpoints matching Spring Boot backend contracts.
 * All dynamic parameters are validated to prevent injection or traversal.
 */
export const API_ENDPOINTS = {
  // Auth & Session
  AUTH: {
    LOGIN: v('/auth/login'),
    LOGOUT: v('/auth/logout'),
    REFRESH: v('/auth/refresh'),
    ME: v(USER_ME_PATH),
  },

  // Catalog & Products
  PRODUCTS: {
    LIST: v(PRODUCTS_BASE),
    DETAIL: (slug: string) => v(`/products/${validateSlug(slug)}`),
    CREATE: v(PRODUCTS_BASE),
    UPDATE: (id: string) => v(`/products/${validateId(id)}`),
    DELETE: (id: string) => v(`/products/${validateId(id)}`),
    SEARCH: v('/products/search'),
    FEATURED: v('/products/featured'),
    TOP_SELLING: v('/products/top-selling'),
    BY_CATEGORY: (slug: string) => v(`/products/category/${validateSlug(slug)}`),
    REVIEWS: (id: string) => v(`/products/${validateId(id)}/reviews`),
    IMAGES: (id: string) => v(`/products/${validateId(id)}/images`),

    /**
     * Clones an existing product catalog item to create a new draft copy.
     *
     * @operation CLONE
     * @http POST
     * @idempotency Non-Idempotent (Do NOT retry on network error)
     * @audience Seller
     * @param id The source product ID to clone
     */
    CLONE: (id: string) => v(`/products/clone/${validateId(id)}`),
    MASTER: v('/products/master'),
  },

  CATEGORIES: {
    LIST: v('/categories'),
    TREE: v('/categories/tree'),
    DETAIL: (id: string) => v(`/categories/${validateId(id)}`),
    PRODUCTS: (id: string) => v(`/categories/${validateId(id)}/products`),
    REQUEST: v('/categories/requests'),
  },

  BRANDS: {
    LIST: v('/brands'),
    DETAIL: (id: string) => v(`/brands/${validateId(id)}`),
    PRODUCTS: (id: string) => v(`/brands/${validateId(id)}/products`),
  },

  // Cart
  CART: {
    GET: v('/cart'),
    ADD: v('/cart/items'),
    UPDATE: (itemId: string) => v(`/cart/items/${validateId(itemId)}`),
    REMOVE: (itemId: string) => v(`/cart/items/${validateId(itemId)}`),
    CLEAR: v('/cart/clear'),

    /**
     * Synchronizes local shopping cart state with the backend database.
     *
     * @operation SYNC
     * @http POST
     * @idempotency Non-Idempotent
     * @audience Customer
     */
    SYNC: v('/cart/sync'),
  },

  // Orders & Checkout
  ORDERS: {
    LIST: v('/orders'),
    DETAIL: (id: string) => v(`/orders/${validateId(id)}`),
    CREATE: v('/orders'),

    /**
     * Finalizes the checkout process and places a new order.
     *
     * @operation CHECKOUT
     * @http POST
     * @idempotency Non-Idempotent (Do NOT retry on network error)
     * @audience Customer
     */
    CHECKOUT: v('/orders/checkout'),
    CANCEL: (id: string) => v(`/orders/${validateId(id)}/cancel`),
    TRACK: (id: string) => v(`/orders/${validateId(id)}/tracking`),
    INVOICE: (id: string) => v(`/orders/${validateId(id)}/invoice`),
    RETURN: (id: string) => v(`/orders/${validateId(id)}/return`),

    /**
     * Server-Sent Events (SSE) stream for order tracking.
     * Explicitly unversioned route bypassed in standard API version prefixes.
     */
    STREAM: (id: string) => rawApiPath(`/api/orders/${validateId(id)}/stream`),
    UPDATE_PAYMENT: (id: string | number) => v(`/orders/${validateId(id)}/payment-status`),
  },

  // Payments
  PAYMENTS: {
    CREATE_INTENT: v('/payments/create-intent'),
    CONFIRM: v('/payments/confirm'),
    REFUND: (id: string) => v(`/payments/${validateId(id)}/refund`),
    METHODS: v('/payments/methods'),
    HISTORY: v('/payments'),

    /**
     * Unversioned Webhook route for Stripe integration.
     */
    WEBHOOK_STRIPE: rawApiPath('/api/webhooks/stripe'),
  },

  // Seller Dashboard & Management
  // Dashboard stats use DASHBOARD.SELLER (v('/dashboard/seller')) below —
  // a near-identically-named SELLER.DASHBOARD (v('/seller/dashboard'))
  // constant used to exist here too, with zero real callers anywhere in
  // the app; removed to avoid the two ever being confused/swapped.
  SELLER: {
    PROFILE: v('/sellers/profile'),
    REGISTER: v('/sellers/register'),
    PRODUCTS: v('/seller/products'),
    ORDERS: v('/seller/orders'),
    ANALYTICS: v('/seller/analytics'),
    PAYOUTS: v('/seller/payouts'),
    INVENTORY: v('/seller/inventory'),
    COUPONS: v('/seller/coupons'),
    STORE: v('/seller/store'),
    CATEGORY_REQUEST: v('/seller/categories/request'),
    REVIEWS: v('/seller/reviews'),
    DISPUTES: v('/seller/disputes'),
    PROMOTIONS: v('/seller/promotions'),
    PROFILE_EXISTS: v('/sellers/profile/exists'),
    CHECK_HANDLE: (handle: string) => v(`/sellers/check-handle/${validateHandle(handle)}`),
  },

  // Inventory
  INVENTORY: {
    LIST: v('/inventory'),
    UPDATE: v('/inventory/stock'),
    RESERVE: v('/inventory/reserve'),
    WAREHOUSES: v('/inventory/warehouses'),
    LOW_STOCK: v('/inventory/low-stock'),
  },

  // Shipping & Logistical Tracking
  SHIPPING: {
    CALCULATE: v('/shipping/calculate'),
    METHODS: v('/shipping/methods'),
    TRACK: (trackingId: string) => v(`/shipping/track/${validateAlphanumeric(trackingId)}`),
    CARRIERS: v('/shipping/carriers'),
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: v('/notifications'),
    MARK_READ: (id: string) => v(`/notifications/${validateId(id)}/read`),
    MARK_ALL_READ: v('/notifications/read-all'),
    SETTINGS: v('/notifications/settings'),
    COUNT: v('/notifications/unread-count'),
    DELETE: (id: string) => v(`/notifications/${validateId(id)}`),
  },

  // Wishlist
  WISHLIST: {
    GET: v('/wishlist'),
    ADD: v('/wishlist/items'),
    REMOVE: (productId: string) => v(`/wishlist/items/${validateId(productId)}`),
  },

  // Customer Reviews
  REVIEWS: {
    CREATE: v('/reviews'),
    UPDATE: (id: string) => v(`/reviews/${validateId(id)}`),
    DELETE: (id: string) => v(`/reviews/${validateId(id)}`),
    HELPFUL: (id: string) => v(`/reviews/${validateId(id)}/helpful`),
  },

  // Coupons
  COUPONS: {
    VALIDATE: v('/coupons/validate'),
    APPLY: v('/coupons/apply'),
  },

  // User Profile Addresses
  USERS: {
    PROFILE: v(USER_ME_PATH),
    UPDATE: v(USER_ME_PATH),
    ADDRESSES: v('/users/me/addresses'),
    ADD_ADDRESS: v('/users/me/addresses'),
    UPDATE_ADDRESS: (id: string) => v(`/users/me/addresses/${validateId(id)}`),
    DELETE_ADDRESS: (id: string) => v(`/users/me/addresses/${validateId(id)}`),
    CHANGE_PASSWORD: v('/users/me/password'),
    ORDERS: v('/users/me/orders'),
    /**
     * Reviews authored by the signed-in customer.
     *
     * Distinct from PRODUCTS.REVIEWS, which lists every review *on* a
     * product. The account page needs the inverse relation, and previously
     * had no endpoint at all — it rendered two hardcoded reviews.
     */
    REVIEWS: v('/users/me/reviews'),
  },

  // Delivery Agent Actions
  DELIVERY: {
    PROFILE: v('/delivery/profile'),
    REGISTER: v('/delivery/register'),
    DASHBOARD: v('/delivery/dashboard'),
    ASSIGNED_ORDERS: v('/delivery/orders'),
    UPDATE_STATUS: (orderId: string) => v(`/delivery/orders/${validateId(orderId)}/status`),
    EARNINGS: v('/delivery/earnings'),
    LOCATION_UPDATE: v('/delivery/location'),
    AVAILABILITY: v('/delivery/availability'),
  },

  // Tax Configurations
  TAX: {
    CALCULATE: v('/tax/calculate'),
    CLASSES: v('/tax/classes'),
    RATES: v('/tax/rates'),
  },

  // Locations & Address Verification
  LOCATIONS: {
    COUNTRIES: v('/locations/countries'),
    STATES: v('/locations/states'),
    DISTRICTS: v('/locations/districts'),
    PINCODES: v('/locations/pincodes'),
    VALIDATE: v('/locations/validate-pincode'),
  },

  // Analytics
  ANALYTICS: {
    SELLER: v('/analytics/seller'),
    REVENUE: v('/analytics/revenue'),
    PRODUCTS: v('/analytics/products'),
    ORDERS: v('/analytics/orders'),
  },

  // Stores
  STORES: {
    LIST: v('/stores'),
    DETAIL: (id: string) => v(`/stores/${validateId(id)}`),
  },

  // Role Dashboards
  DASHBOARD: {
    SELLER: v('/dashboard/seller'),
    ADMIN: v('/dashboard/admin'),
    CUSTOMER: v('/dashboard/customer'),
    DELIVERY_AGENT: v('/dashboard/delivery-agent'),
  },

  // Customer Support
  SUPPORT: {
    /**
     * Public contact-form intake.
     *
     * Unauthenticated by design — a prospective customer with a pre-purchase
     * question has no account yet. The Next.js route in front of it
     * (app/api/contact) supplies the throttling and validation that a public
     * write endpoint requires.
     */
    CONTACT: v('/support/contact'),
  },

  // Product Tags
  TAGS: {
    LIST: v('/tags'),
    DETAIL: (id: string) => v(`/tags/${validateId(id)}`),
  },

  // Admin Catalog moderation
  ADMIN_CATALOG: {
    DUPLICATE_CANDIDATES: v('/admin/catalog/duplicate-candidates'),

    /**
     * Merges duplicate product catalog candidates under a target canonical ID.
     *
     * @operation MERGE
     * @http POST
     * @idempotency Non-Idempotent (Do NOT retry on network error)
     * @audience Admin
     * @param sourceId The ID of the duplicate product to be merged
     * @param targetId The ID of the canonical target product
     */
    MERGE: (sourceId: string | number, targetId: string | number) =>
      v(`/admin/catalog/merge?sourceId=${validateId(sourceId)}&targetId=${validateId(targetId)}`),

    DISMISS: (id: string | number) => v(`/admin/catalog/dismiss-candidate/${validateId(id)}`),
  },
} as const;

/**
 * Centralized API & Resilience configuration rules.
 */
export const API_CONFIG = {
  TIMEOUT: {
    DEFAULT: 15000,
    UPLOAD: 120000,
    DOWNLOAD: 60000,
    STREAM: 0,
    AUTH: 5000,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 30000,
    BACKOFF_FACTOR: 2,
    JITTER_FACTOR: 0.1,
    IDEMPOTENT_METHODS: ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'] as const,
    RETRYABLE_STATUSES: [408, 429, 502, 503, 504] as const,
  },
} as const;

/**
 * Standardized and enriched HTTP response status codes.
 */
export const HTTP_STATUS = {
  // Redirection
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const isSuccess = (status: number): boolean => status >= 200 && status < 300;
export const isClientError = (status: number): boolean => status >= 400 && status < 500;
export const isServerError = (status: number): boolean => status >= 500 && status < 600;
export const isRetryable = (status: number): boolean =>
  (API_CONFIG.RETRY.RETRYABLE_STATUSES as readonly number[]).includes(status);
