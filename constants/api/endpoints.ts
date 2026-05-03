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
  // Auth - No versioning (/api/auth)
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },

  // Users - Versioned (/api/v1/users)
  USERS: {
    PROFILE: '/api/v1/users/me',
    ADDRESSES: '/api/v1/users/addresses',
  },

  // Products - Versioned (/api/v1/products)
  PRODUCTS: {
    LIST: '/api/v1/products',
    DETAIL: (id: string) => `/api/v1/products/${id}`,
    SEARCH: '/api/v1/products/search',
    CREATE: '/api/v1/products',
    UPDATE: (id: string) => `/api/v1/products/${id}`,
    DELETE: (id: string) => `/api/v1/products/${id}`,
    BATCH: '/api/v1/products/batch',
  },

  // Cart - Versioned (/api/v1/cart)
  CART: {
    GET: '/api/v1/cart',
    ADD_ITEM: '/api/v1/cart/items',
    UPDATE_ITEM: (itemId: string) => `/api/v1/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: string) => `/api/v1/cart/items/${itemId}`,
    CLEAR: '/api/v1/cart/clear',
  },

  // Orders - Versioned (/api/v1/orders)
  ORDERS: {
    LIST: '/api/v1/orders',
    CREATE: '/api/v1/orders',
    DETAIL: (id: string) => `/api/v1/orders/${id}`,
    BY_NUMBER: (orderNumber: string) => `/api/v1/orders/number/${orderNumber}`,
    MY_ORDERS: '/api/v1/orders/my-orders',
    BY_STATUS: (status: string) => `/api/v1/orders/status/${status}`,
    BY_SHOP: (shopId: string) => `/api/v1/orders/shop/${shopId}`,
    UPDATE_STATUS: (orderId: string) => `/api/v1/orders/${orderId}/status`,
    UPDATE_PAYMENT_STATUS: (orderId: string) => `/api/v1/orders/${orderId}/payment-status`,
    MY_DELIVERIES: '/api/v1/orders/delivery/my-deliveries',
  },

  // Dashboard - Versioned (/api/v1/dashboard)
  DASHBOARD: {
    SELLER: '/api/v1/dashboard/seller',
    ADMIN: '/api/v1/dashboard/admin',
    CUSTOMER: '/api/v1/dashboard/customer',
    DELIVERY_AGENT: '/api/v1/dashboard/delivery-agent',
  },

  // Sellers - Versioned (/api/v1/sellers)
  SELLERS: {
    REGISTER: '/api/v1/sellers/register',
    PROFILE: '/api/v1/sellers/profile',
    PROFILE_EXISTS: '/api/v1/sellers/profile/exists',
    PAYOUTS: '/api/v1/sellers/payouts',
    PROMOTIONS: '/api/v1/sellers/promotions',
  },

  // Seller Stores - Versioned (/api/v1/seller/store)
  SELLER_STORE: {
    MY_STORE: '/api/v1/seller/store',
    EXISTS: '/api/v1/seller/store/exists',
  },

  // Stores (public + seller management)
  STORES: {
    LIST: '/api/v1/stores',
    DETAIL: (id: string | number) => `/api/v1/stores/${id}`,
  },

  // Seller Dashboard Products (/api/seller/products)
  SELLER_PRODUCTS: {
    LIST: '/api/seller/products',
    CREATE: '/api/seller/products',
    UPDATE: (id: string | number) => `/api/seller/products/${id}`,
    DELETE: (id: string | number) => `/api/seller/products/${id}`,
    TOGGLE_STATUS: (id: string | number) => `/api/seller/products/${id}/toggle-status`,
  },

  // Categories - Versioned (/api/v1/categories)
  CATEGORIES: {
    LIST: '/api/v1/categories',
    DETAIL: (id: string) => `/api/v1/categories/${id}`,
    TREE: '/api/v1/categories/tree',
    CREATE: '/api/v1/categories',
    UPDATE: (id: string) => `/api/v1/categories/${id}`,
    DELETE: (id: string) => `/api/v1/categories/${id}`,
  },

  // Coupons - Versioned (/api/v1/coupons)
  COUPONS: {
    LIST: '/api/v1/coupons',
    DETAIL: (id: string) => `/api/v1/coupons/${id}`,
    VALIDATE: (code: string) => `/api/v1/coupons/validate/${code}`,
    CREATE: '/api/v1/coupons',
    UPDATE: (id: string) => `/api/v1/coupons/${id}`,
    DELETE: (id: string) => `/api/v1/coupons/${id}`,
  },

  // Payments - Versioned (/api/v1/payments)
  PAYMENTS: {
    CREATE_INTENT: '/api/v1/payments/create-intent',
    CONFIRM: '/api/v1/payments/confirm',
    REFUND: (id: string) => `/api/v1/payments/${id}/refund`,
    ANALYTICS: '/api/v1/payments/analytics',
  },

  // Product Reviews - Versioned (/api/v1/productReviews)
  REVIEWS: {
    LIST: (productId: string) => `/api/v1/products/${productId}/reviews`,
    CREATE: (productId: string) => `/api/v1/products/${productId}/reviews`,
    UPDATE: (id: string) => `/api/v1/productReviews/${id}`,
    DELETE: (id: string) => `/api/v1/productReviews/${id}`,
  },

  // Wishlist - Versioned (if exists in backend)
  WISHLIST: {
    GET: '/api/v1/wishlist',
    ADD: '/api/v1/wishlist/items',
    REMOVE: (id: string) => `/api/v1/wishlist/items/${id}`,
  },

  // Notifications - Versioned (if exists in backend)
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
  },

  // Brands - Versioned (/api/v1/brands)
  BRANDS: {
    LIST: '/api/v1/brands',
    DETAIL: (id: string) => `/api/v1/brands/${id}`,
  },

  // Tags - Versioned (/api/v1/tags)
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
