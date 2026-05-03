/**
 * Routes Configuration
 * Centralized route definitions for the application
 */

export const routes = {
  // Public Routes
  home: '/',
  products: '/products',
  productDetail: (id: string) => `/products/${id}`,
  
  // Auth Routes
  login: '/login',
  register: '/register',
  logout: '/logout',
  
  // User Routes
  dashboard: '/dashboard',
  profile: '/settings',
  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  cart: '/cart',
  checkout: '/checkout',
  wishlist: '/wishlist',
  
  // Seller Routes
  seller: {
    dashboard: '/seller',
    products: '/seller/products',
    addProduct: '/seller/products/add',
    editProduct: (id: string) => `/seller/products/${id}/edit`,
    orders: '/seller/orders',
  },
  
  // Admin Routes
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    products: '/admin/products',
    orders: '/admin/orders',
    categories: '/admin/categories',
    analytics: '/admin/analytics',
  },
  
  // Delivery Routes
  delivery: {
    dashboard: '/delivery',
    orders: '/delivery/orders',
    orderDetail: (id: string) => `/delivery/orders/${id}`,
  },
  
  // Error Routes
  error: {
    notFound: '/404',
    accessDenied: '/403',
    serverError: '/500',
  },
} as const;

export type Routes = typeof routes;
