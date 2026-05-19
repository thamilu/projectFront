/**
 * API Constants
 * Centralized API endpoints matching Spring Boot backend
 *
 * IMPORTANT: Axios baseURL is http://localhost:8082 (no /api prefix)
 *            All endpoints must include full path starting with /api/
 *
 * Request Flow:
 *   Frontend calls: /api/v1/products
 *   Axios baseURL: http://localhost:8082
 *   Final URL: http://localhost:8082/api/v1/products
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/users/me',
  },

  // Catalog
  PRODUCTS: {
    LIST: '/api/v1/products',
    DETAIL: (slug: string) => `/api/v1/products/${slug}`,
    CREATE: '/api/v1/products',
    UPDATE: (id: string) => `/api/v1/products/${id}`,
    DELETE: (id: string) => `/api/v1/products/${id}`,
    SEARCH: '/api/v1/products/search',
    FEATURED: '/api/v1/products/featured',
    TOP_SELLING: '/api/v1/products/top-selling',
    BY_CATEGORY: (slug: string) => `/api/v1/products/category/${slug}`,
    REVIEWS: (id: string) => `/api/v1/products/${id}/reviews`,
    IMAGES: (id: string) => `/api/v1/products/${id}/images`,
  },

  CATEGORIES: {
    LIST: '/api/v1/categories',
    TREE: '/api/v1/categories/tree',
    DETAIL: (id: string) => `/api/v1/categories/${id}`,
    PRODUCTS: (id: string) => `/api/v1/categories/${id}/products`,
    REQUEST: '/api/v1/categories/requests',
  },

  BRANDS: {
    LIST: '/api/v1/brands',
    DETAIL: (id: string) => `/api/v1/brands/${id}`,
    PRODUCTS: (id: string) => `/api/v1/brands/${id}/products`,
  },

  // Cart
  CART: {
    GET: '/api/v1/cart',
    ADD: '/api/v1/cart/items',
    UPDATE: (itemId: string) => `/api/v1/cart/items/${itemId}`,
    REMOVE: (itemId: string) => `/api/v1/cart/items/${itemId}`,
    CLEAR: '/api/v1/cart/clear',
    SYNC: '/api/v1/cart/sync',
  },

  // Orders
  ORDERS: {
    LIST: '/api/v1/orders',
    DETAIL: (id: string) => `/api/v1/orders/${id}`,
    CREATE: '/api/v1/orders',
    CHECKOUT: '/api/v1/orders/checkout',
    CANCEL: (id: string) => `/api/v1/orders/${id}/cancel`,
    TRACK: (id: string) => `/api/v1/orders/${id}/tracking`,
    INVOICE: (id: string) => `/api/v1/orders/${id}/invoice`,
    RETURN: (id: string) => `/api/v1/orders/${id}/return`,
    STREAM: (id: string) => `/api/orders/${id}/stream`,
    UPDATE_PAYMENT: (id: string | number) => `/api/v1/orders/${id}/payment-status`,
  },

  // Payments
  PAYMENTS: {
    CREATE_INTENT: '/api/payments/create-intent',
    CONFIRM: '/api/v1/payments/confirm',
    REFUND: (id: string) => `/api/v1/payments/${id}/refund`,
    METHODS: '/api/v1/payments/methods',
    HISTORY: '/api/v1/payments',
    WEBHOOK_STRIPE: '/api/webhooks/stripe',
  },

  // Seller
  SELLER: {
    PROFILE: '/api/v1/sellers/profile',
    REGISTER: '/api/v1/sellers/register',
    DASHBOARD: '/api/v1/seller/dashboard',
    PRODUCTS: '/api/v1/seller/products',
    ORDERS: '/api/v1/seller/orders',
    ANALYTICS: '/api/v1/seller/analytics',
    PAYOUTS: '/api/v1/seller/payouts',
    INVENTORY: '/api/v1/seller/inventory',
    COUPONS: '/api/v1/seller/coupons',
    STORE: '/api/v1/seller/store',
    REVIEWS: '/api/v1/seller/reviews',
    DISPUTES: '/api/v1/seller/disputes',
    PROMOTIONS: '/api/v1/seller/promotions',
    PROFILE_EXISTS: '/api/v1/sellers/profile/exists',
    CHECK_HANDLE: (handle: string) => `/api/v1/sellers/check-handle/${handle}`,
  },

  // Inventory
  INVENTORY: {
    LIST: '/api/v1/inventory',
    UPDATE: '/api/v1/inventory/stock',
    RESERVE: '/api/v1/inventory/reserve',
    WAREHOUSES: '/api/v1/inventory/warehouses',
    LOW_STOCK: '/api/v1/inventory/low-stock',
  },

  // Shipping
  SHIPPING: {
    CALCULATE: '/api/v1/shipping/calculate',
    METHODS: '/api/v1/shipping/methods',
    TRACK: (trackingId: string) => `/api/v1/shipping/track/${trackingId}`,
    CARRIERS: '/api/v1/shipping/carriers',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
    SETTINGS: '/api/v1/notifications/settings',
    COUNT: '/api/v1/notifications/unread-count',
  },

  // Wishlist
  WISHLIST: {
    GET: '/api/v1/wishlist',
    ADD: '/api/v1/wishlist/items',
    REMOVE: (productId: string) => `/api/v1/wishlist/items/${productId}`,
    CHECK: (productId: string) => `/api/v1/wishlist/check/${productId}`,
  },

  // Reviews
  REVIEWS: {
    CREATE: '/api/v1/reviews',
    UPDATE: (id: string) => `/api/v1/reviews/${id}`,
    DELETE: (id: string) => `/api/v1/reviews/${id}`,
    HELPFUL: (id: string) => `/api/v1/reviews/${id}/helpful`,
  },

  // Coupons
  COUPONS: {
    VALIDATE: '/api/v1/coupons/validate',
    APPLY: '/api/v1/coupons/apply',
  },

  // Users
  USERS: {
    PROFILE: '/api/v1/users/me',
    UPDATE: '/api/v1/users/me',
    ADDRESSES: '/api/v1/users/me/addresses',
    ADD_ADDRESS: '/api/v1/users/me/addresses',
    UPDATE_ADDRESS: (id: string) => `/api/v1/users/me/addresses/${id}`,
    DELETE_ADDRESS: (id: string) => `/api/v1/users/me/addresses/${id}`,
    CHANGE_PASSWORD: '/api/v1/users/me/password',
    ORDERS: '/api/v1/users/me/orders',
  },

  // Delivery Agent
  DELIVERY: {
    PROFILE: '/api/v1/delivery/profile',
    REGISTER: '/api/v1/delivery/register',
    DASHBOARD: '/api/v1/delivery/dashboard',
    ASSIGNED_ORDERS: '/api/v1/delivery/orders',
    UPDATE_STATUS: (orderId: string) => `/api/v1/delivery/orders/${orderId}/status`,
    EARNINGS: '/api/v1/delivery/earnings',
    LOCATION_UPDATE: '/api/v1/delivery/location',
    AVAILABILITY: '/api/v1/delivery/availability',
  },

  // Tax
  TAX: {
    CALCULATE: '/api/v1/tax/calculate',
    CLASSES: '/api/v1/tax/classes',
    RATES: '/api/v1/tax/rates',
  },

  // Locations
  LOCATIONS: {
    COUNTRIES: '/api/v1/locations/countries',
    STATES: '/api/v1/locations/states',
    DISTRICTS: '/api/v1/locations/districts',
    PINCODES: '/api/v1/locations/pincodes',
    VALIDATE: '/api/v1/locations/validate-pincode',
  },

  // Analytics (seller)
  ANALYTICS: {
    SELLER: '/api/v1/analytics/seller',
    REVENUE: '/api/v1/analytics/revenue',
    PRODUCTS: '/api/v1/analytics/products',
    ORDERS: '/api/v1/analytics/orders',
  },

  // Store
  STORES: {
    LIST: '/api/v1/stores',
    DETAIL: (id: string) => `/api/v1/stores/${id}`,
  },
  // Dashboard
  DASHBOARD: {
    SELLER: '/api/v1/dashboard/seller',
    ADMIN: '/api/v1/dashboard/admin',
    CUSTOMER: '/api/v1/dashboard/customer',
    DELIVERY_AGENT: '/api/v1/dashboard/delivery-agent',
  },

  // Tags
  TAGS: {
    LIST: '/api/v1/tags',
    DETAIL: (id: string) => `/api/v1/tags/${id}`,
  },
} as const;

export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
