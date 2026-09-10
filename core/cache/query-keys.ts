export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    list: (params?: any) => ['products', 'list', params] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    reviews: (id: string) => ['products', id, 'reviews'] as const,
    images: (id: string) => ['products', id, 'images'] as const,
    featured: ['products', 'featured'] as const,
    topSelling: ['products', 'top-selling'] as const,
    search: (q: string) => ['products', 'search', q] as const,
  },
  // Categories
  categories: {
    all: ['categories'] as const,
    tree: ['categories', 'tree'] as const,
    detail: (id: string) => ['categories', id] as const,
  },
  // Cart
  cart: {
    current: ['cart'] as const,
  },
  // Orders
  orders: {
    all: ['orders'] as const,
    list: (params?: any) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', id] as const,
    tracking: (id: string) => ['orders', id, 'tracking'] as const,
  },
  // Payments
  payments: {
    methods: ['payments', 'methods'] as const,
    history: ['payments', 'history'] as const,
  },
  // Seller
  seller: {
    profile: ['seller', 'profile'] as const,
    dashboard: ['seller', 'dashboard'] as const,
    products: (params?: any) => ['seller', 'products', params] as const,
    orders: (params?: any) => ['seller', 'orders', params] as const,
    analytics: (period?: string) => ['seller', 'analytics', period] as const,
    inventory: ['seller', 'inventory'] as const,
    coupons: ['seller', 'coupons'] as const,
    payouts: ['seller', 'payouts'] as const,
    reviews: ['seller', 'reviews'] as const,
    store: ['seller', 'store'] as const,
  },
  // User
  user: {
    profile: ['user', 'profile'] as const,
    addresses: ['user', 'addresses'] as const,
    paymentMethods: ['user', 'payment-methods'] as const,
  },
  // Wishlist
  wishlist: {
    current: ['wishlist'] as const,
    check: (productId: string) => ['wishlist', 'check', productId] as const,
  },
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
    settings: ['notifications', 'settings'] as const,
  },
  // Delivery
  delivery: {
    profile: ['delivery', 'profile'] as const,
    dashboard: ['delivery', 'dashboard'] as const,
    orders: (params?: any) => ['delivery', 'orders', params] as const,
    earnings: (period?: string) => ['delivery', 'earnings', period] as const,
  },
  // Shipping
  shipping: {
    methods: ['shipping', 'methods'] as const,
    calculate: (data: any) => ['shipping', 'calculate', data] as const,
  },
  // Reviews
  reviews: {
    product: (productId: string) => ['reviews', 'product', productId] as const,
  },
  // Analytics
  analytics: {
    seller: (period?: string) => ['analytics', 'seller', period] as const,
  },
  // Locations
  locations: {
    countries: ['locations', 'countries'] as const,
    states: (countryId: string) => ['locations', 'states', countryId] as const,
    districts: (stateId: string) => ['locations', 'districts', stateId] as const,
  },
} as const;
