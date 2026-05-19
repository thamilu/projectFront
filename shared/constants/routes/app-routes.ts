/**
 * Application Routes Constants
 * Centralized route definitions
 */

export const APP_ROUTES = {
  HOME: '/',

  // Auth (Keycloak)
  AUTH_LOGIN: '/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_SIGNOUT: '/auth/signout',

  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  PRODUCT_REVIEWS: (slug: string) => `/products/${slug}/reviews`,

  // Cart & Checkout
  CART: '/cart',
  CHECKOUT: '/checkout',

  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  ORDER_TRACK: (id: string) => `/orders/${id}/track`,
  ORDER_RETURN: (id: string) => `/orders/${id}/return`,
  ORDER_INVOICE: (id: string) => `/orders/${id}/invoice`,

  // Promotions & Discovery
  SEARCH: '/search',
  CATEGORIES: '/categories',
  DEALS: '/deals',
  FLASH_DEALS: '/flash-deals',
  COMPARE: '/compare',
  STORES: {
    LIST: '/stores',
    DETAIL: (id: string | number) => `/stores/${id}`,
  },

  // Customer Account
  ACCOUNT: {
    BASE: '/account',
    PROFILE: '/account/profile',
    ADDRESSES: '/account/addresses',
    PAYMENT_METHODS: '/account/payment-methods',
    ORDERS: '/account/orders',
    REVIEWS: '/account/reviews',
    SECURITY: '/account/security',
  },

  // User
  PROFILE: '/account/profile',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_SETTINGS: '/notifications/settings',
  ANALYTICS: '/analytics',

  // Customer
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
  },

  // Become
  BECOME_SELLER: '/become-seller',
  BECOME_DELIVERY_AGENT: '/become-delivery-agent',

  // Seller
  SELLER: {
    BASE: '/seller',
    DASHBOARD: '/seller/dashboard',
    REGISTER: '/seller/register',
    PROFILE: '/seller/profile',
    STORE: '/seller/store',
    STORE_CREATE: '/seller/store/create',
    PRODUCTS: '/seller/products',
    PRODUCTS_CREATE: '/seller/products/create',
    ADD_PRODUCT: '/seller/products/create',
    EDIT_PRODUCT: (id: string) => `/seller/products/${id}/edit`,
    ORDERS: '/seller/orders',
    ANALYTICS: '/seller/analytics',
    SETTINGS: '/seller/settings',
    INVENTORY: '/seller/inventory',
    PAYOUTS: '/seller/payouts',
    REVIEWS: '/seller/reviews',
    DISPUTES: '/seller/disputes',
    COUPONS: '/seller/coupons',
    PROMOTIONS: '/seller/promotions',
  },

  // Delivery
  DELIVERY: {
    BASE: '/delivery',
    DASHBOARD: '/delivery',
    ORDERS: '/delivery/orders',
    ORDER_DETAIL: (id: string) => `/delivery/orders/${id}`,
    ASSIGNED: '/delivery/assigned',
    HISTORY: '/delivery/history',
    MAP: '/delivery/map',
    EARNINGS: '/delivery/earnings',
    PROFILE: '/delivery/profile',
  },

  // Public Pages
  ABOUT: '/about',
  CONTACT: '/contact',
  HELP: '/help',
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Error & Special
  NOT_FOUND: '/404',
  ACCESS_DENIED: '/403',
  SERVER_ERROR: '/500',
  UNAUTHORIZED: '/unauthorized',
  DASHBOARD: '/dashboard',
} as const;

export type AppRoutes = typeof APP_ROUTES;
