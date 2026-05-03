export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.posts.lists(), { filters }] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },
  products: {
    all: ['products'] as const,
    lists: () => [...(['products'] as const), 'list'] as const,
    list: (params: object) => [...(['products', 'list'] as const), params] as const,
    details: () => [...(['products'] as const), 'detail'] as const,
    detail: (id: number | string) => [...(['products', 'detail'] as const), id] as const,
    search: (q: string, params: object) =>
      [...(['products', 'search'] as const), q, params] as const,
    featured: () => [...(['products', 'featured'] as const)],
    categories: () => [...(['products', 'categories'] as const)],
    brands: () => [...(['products', 'brands'] as const)],
    tags: () => [...(['products', 'tags'] as const)],
  },
  cart: {
    all: ['cart'] as const,
    detail: () => ['cart', 'detail'] as const,
  },

  seller: {
    all: ['seller'] as const,
    profile: () => ['seller', 'profile'] as const,
    profileExists: () => ['seller', 'profile', 'exists'] as const,
    store: () => ['seller', 'store'] as const,
    storeExists: () => ['seller', 'store', 'exists'] as const,
    products: (params?: object) => ['seller', 'products', params || {}] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...(['orders'] as const), 'list'] as const,
    list: (params: object) => [...(['orders', 'list'] as const), params] as const,
    details: () => [...(['orders'] as const), 'detail'] as const,
    detail: (id: number | string) => [...(['orders', 'detail'] as const), id] as const,
  },
} as const;
