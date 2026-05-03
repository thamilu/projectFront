# Reusable Functions Reference

> **Purpose**: This document lists every reusable helper, hook, and utility available in the project.  
> Use this as your first stop before writing a new function — it may already exist.

---

## Table of Contents

1. [API & HTTP Utilities](#1-api--http-utilities)
2. [Formatting & Display](#2-formatting--display)
3. [Authentication Hooks](#3-authentication-hooks)
4. [Query Hooks (React Query)](#4-query-hooks-react-query)
5. [UI / General Hooks](#5-ui--general-hooks)
6. [Store Helpers (Zustand)](#6-store-helpers-zustand)
7. [Validation Utilities](#7-validation-utilities)
8. [Pagination Helpers](#8-pagination-helpers)

---

## 1. API & HTTP Utilities

### `unwrapData<T>` — Unwrap API Response Envelope
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

All backend responses follow `{ data: { data: T } }`. This helper unwraps that envelope in one call.

```ts
import { unwrapData } from '@/lib/api/client/utils';

const product = unwrapData(await apiClient.get<ApiResponse<ProductDTO>>('/api/products/1'));
// instead of: response.data.data!
```

---

### `transformApiError(error)` — Normalize Axios Errors
**File:** [`lib/axios.ts`](../lib/axios.ts)

Converts any `AxiosError` into a typed `ApiError` with a `message`, `status`, and optional `errors` map. Automatically applied by interceptors — only use directly if you need to normalize errors outside of axios.

```ts
import { transformApiError } from '@/lib/axios';
try { ... } catch (err) { throw transformApiError(err as AxiosError); }
```

---

### `deduplicateRequest<T>(key, requestFn)` — Prevent Duplicate Concurrent Requests
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

If the same network request is triggered multiple times before the first resolves, all callers share one Promise.

```ts
import { deduplicateRequest } from '@/lib/api/client/utils';

const data = await deduplicateRequest('user-profile', () => fetchUserProfile());
```

---

### `withCache<T>(key, requestFn, ttl?)` — Client-Side Response Caching
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

Caches a request result in memory for `ttl` milliseconds (default: 5 minutes). Subsequent calls return the cached value immediately.

```ts
import { withCache } from '@/lib/api/client/utils';

const categories = await withCache('categories', () => categoryApi.getAll(), 10 * 60 * 1000);
```

---

### `withFallback<T>(requestFn, fallback)` — Graceful Degradation
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

Runs an API call and returns `fallback` if it fails. Useful for non-critical features (recommendations, banners, etc.).

```ts
import { withFallback } from '@/lib/api/client/utils';

const featured = await withFallback(() => productApi.getFeatured(), []);
```

---

### `withOptimisticUpdate<T>(updateFn, optimisticValue, rollbackFn?)` — Optimistic UI
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

Performs an update and calls `rollbackFn` automatically if it fails.

```ts
import { withOptimisticUpdate } from '@/lib/api/client/utils';

await withOptimisticUpdate(
  () => wishlistApi.toggle(productId),
  optimisticState,
  () => revertLocalState()
);
```

---

### `retryWithBackoff<T>(fn, maxRetries?, baseDelay?)` — Manual Retry
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

Retries any async function with exponential backoff. The built-in axios retry handles most cases automatically; use this for non-axios async operations.

```ts
import { retryWithBackoff } from '@/lib/api/client/utils';

const result = await retryWithBackoff(() => sendWebhook(payload), 3, 500);
```

---

### `createCancellableRequest<T>(requestFn)` — AbortController Wrapper
**File:** [`lib/api/client/axios.ts`](../lib/api/client/axios.ts)

Returns `{ promise, cancel }`. Call `cancel()` on unmount or when a new search query replaces the old one.

```ts
import { createCancellableRequest } from '@/lib/api/client/axios';

const { promise, cancel } = createCancellableRequest(
  (signal) => apiClient.get('/api/products', { signal })
);
useEffect(() => () => cancel(), []);
```

---

### `prefetch<T>(key, requestFn, ttl?)` — Predictive Prefetch
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

Fire-and-forget prefetch. Populates the in-memory cache before the user navigates (e.g., on link hover).

```ts
import { prefetch } from '@/lib/api/client/utils';

<div onMouseEnter={() => prefetch('product-42', () => productApi.getById(42))}>
  View Product
</div>
```

---

### `checkApiHealth()` — Backend Health Check
**File:** [`lib/api/client/axios.ts`](../lib/api/client/axios.ts)

Returns `true` if the backend `/api/v1/health` endpoint responds with HTTP 200.

```ts
import { checkApiHealth } from '@/lib/api/client/axios';

const isHealthy = await checkApiHealth();
```

---

## 2. Formatting & Display

> **Canonical source:** [`lib/formatters.ts`](../lib/formatters.ts)  
> Also available via barrel: `import { ... } from '@/lib/utils'`

| Function | Description | Example Output |
|----------|-------------|----------------|
| `formatCurrency(amount, currency?, locale?)` | Formats a number as currency | `formatCurrency(1999.5)` → `"$1,999.50"` |
| `formatPrice(amount)` | Alias for `formatCurrency` | `formatPrice(299)` → `"$299"` |
| `formatNumber(value, locale?)` | Locale-aware number formatting | `formatNumber(1234567)` → `"1,234,567"` |
| `formatCompactNumber(value, locale?)` | Short notation | `formatCompactNumber(12500)` → `"12.5K"` |
| `formatPercentage(value, decimals?)` | Percentage display | `formatPercentage(25)` → `"25.0%"` |
| `calculateDiscount(original, selling)` | Discount % rounded | `calculateDiscount(100, 75)` → `25` |
| `formatDate(dateString, options?, locale?)` | Locale date | `formatDate('2025-01-15')` → `"Jan 15, 2025"` |
| `formatDateTime(dateString, locale?)` | Date + time | → `"Jan 15, 2025, 10:30 AM"` |
| `formatRelativeTime(dateString)` | Human-relative | → `"3h ago"` / `"Just now"` |
| `formatOrderNumber(orderNumber)` | Uppercases order number | `formatOrderNumber('ord-001')` → `"ORD-001"` |
| `truncate(text, maxLength)` | Ellipsis truncation | `truncate("Hello World", 7)` → `"Hello…"` |

### Unique helpers in `lib/utils/index.ts`

| Function | Description |
|----------|-------------|
| `cn(...inputs)` | Merges Tailwind class names safely via `clsx` + `tailwind-merge` |
| `isLowStock(qty, threshold?)` | `true` if `0 < qty <= threshold` (default 10) |
| `isOutOfStock(qty)` | `true` if `qty <= 0` |
| `truncateText(text, maxLength)` | Alias for `truncate` (backward compat) |
| `debounce(func, delay)` | Returns debounced version of any function |
| `getInitials(firstName, lastName)` | `"John Doe"` → `"JD"` |
| `generateOrderNumber()` | Generates `ORD-{timestamp}-{random}` |
| `sleep(ms)` | Promise-based delay |
| `generateId()` | `crypto.randomUUID()` wrapper |

---

## 3. Authentication Hooks

> **Canonical source:** [`hooks/use-auth.ts`](../hooks/use-auth.ts)  
> Also re-exported from `@/hooks` barrel.

### `useAuth()` — Main Auth Hook
```ts
import { useAuth } from '@/hooks/use-auth';

const { user, isLoading, isAuthenticated, login, logout, refreshToken, refetch } = useAuth();
```

| Return | Type | Description |
|--------|------|-------------|
| `user` | `AuthUser \| null` | Current user with `id`, `email`, `name`, `roles` |
| `isLoading` | `boolean` | True while fetching session |
| `isAuthenticated` | `boolean` | True when user is logged in |
| `login(redirectTo?)` | `void` | Redirects to `/login` |
| `logout()` | `Promise<void>` | Keycloak + NextAuth sign-out |
| `refreshToken()` | `Promise<boolean>` | Manual token refresh |
| `refetch()` | `Promise<void>` | Re-fetch user from `/api/auth/me` |

---

### `useRequireAuth(redirectTo?)` — Route Protection
Automatically protects a page — redirects to `/login` if not authenticated.

```ts
const { user, isLoading } = useRequireAuth();
```

---

### `useRequireRole(requiredRoles)` — Role-Based Route Protection
Redirects to `/403` if the user doesn't have one of the required roles.

```ts
import { useRequireRole } from '@/hooks/use-auth';

const auth = useRequireRole(['ADMIN', 'SELLER']);
```

---

### `useHasRole(roles, requireAll?)` — Permission Check
```ts
import { useHasRole } from '@/hooks/use-auth';

const canEdit = useHasRole(['ADMIN', 'SELLER']);       // any role
const isSuperAdmin = useHasRole('SUPER_ADMIN');
const hasAll = useHasRole(['ADMIN', 'SELLER'], true);  // all roles required
```

---

### `useLoginRedirect()` — Login Button Helper
Returns a callback that redirects to `/login?redirectTo=<currentPath>`.

```ts
import { useLoginRedirect } from '@/hooks/use-auth';

const redirectToLogin = useLoginRedirect();
<button onClick={redirectToLogin}>Log In</button>
```

---

### `usePermissions()` — Fine-Grained Permission Checks
**File:** [`hooks/use-permissions.ts`](../hooks/use-permissions.ts)

```ts
import { usePermissions } from '@/hooks/use-permissions';

const { hasRole, hasPermission, hasAnyPermission, isAdmin, isSuperAdmin } = usePermissions();

hasRole('SELLER');
hasPermission('products:write');
hasAnyPermission(['orders:read', 'orders:write']);
```

---

## 4. Query Hooks (React Query)

### Products
**File:** [`hooks/queries/use-products.ts`](../hooks/queries/use-products.ts)

| Hook | Description |
|------|-------------|
| `useProducts(params?)` | Paginated product list |
| `useProduct(id)` | Single product by ID |
| `useSearchProducts(query, params?)` | Search with debounced query |
| `useFeaturedProducts()` | Featured products list |
| `useCategories()` | All categories |
| `useBrands()` | All brands |
| `useTags()` | All tags |

### Orders
**File:** [`hooks/queries/use-orders.ts`](../hooks/queries/use-orders.ts)

| Hook | Description |
|------|-------------|
| `useOrders(params?)` | Paginated order list |
| `useOrder(id)` | Single order by ID |
| `useOrderByNumber(orderNumber)` | Single order by order number |
| `useCreateOrder()` | Mutation — create new order |
| `useUpdateOrderStatus(id)` | Mutation — update order status |
| `useUpdatePaymentStatus(id)` | Mutation — update payment status |

### Cart
**File:** [`hooks/queries/use-cart.ts`](../hooks/queries/use-cart.ts)

```ts
import { useCartQuery } from '@/hooks/queries/use-cart';
const { data: cart, isLoading } = useCartQuery();
```

### Seller
**File:** [`hooks/queries/use-seller.ts`](../hooks/queries/use-seller.ts)

```ts
import { useSellerStore, useSellerProducts } from '@/hooks/queries/use-seller';
```

---

## 5. UI / General Hooks

> **Source:** [`hooks/index.ts`](../hooks/index.ts)

| Hook | Signature | Description |
|------|-----------|-------------|
| `useDebounce<T>` | `(value, delay?)` | Debounces a value; delays update until `delay`ms after last change |
| `useAsync<T>` | `(asyncFn, immediate?)` | Tracks `status`, `data`, `error` for any async function |
| `usePagination` | `(initialPage?, initialSize?)` | Returns `page`, `size`, `nextPage`, `prevPage`, `goToPage`, `changeSize` |
| `useLocalStorage<T>` | `(key, initialValue)` | SSR-safe localStorage state: returns `[value, setValue, removeValue]` |
| `useMediaQuery` | `(query)` | Matches a CSS media query (SSR-safe) |
| `usePrevious<T>` | `(value)` | Returns the previous value of a variable |
| `useClickOutside<T>` | `(callback)` | Returns a ref; fires `callback` when clicking outside the element |
| `useWindowSize` | `()` | Returns `{ width, height }` of the browser window |

### `useDebounce` Example
```ts
import { useDebounce } from '@/hooks';

const debouncedSearch = useDebounce(searchQuery, 400);
// Only re-runs effects after user stops typing for 400ms
```

### `usePagination` Example
```ts
import { usePagination } from '@/hooks';

const { page, size, nextPage, prevPage, goToPage, changeSize } = usePagination(0, 20);
```

### `useAsync` Example
```ts
import { useAsync } from '@/hooks';

const { execute, data, isLoading, isError } = useAsync(() => fetchDashboard(), false);
```

### `useLocalStorage` Example
```ts
import { useLocalStorage } from '@/hooks';

const [theme, setTheme, removeTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

---

## 6. Store Helpers (Zustand)

### Cart Store Selectors
**File:** [`store/cart-store.ts`](../store/cart-store.ts)

Use **memoized selectors** to avoid unnecessary re-renders:

```ts
import {
  useCartStore,
  selectCartItems,
  selectCartItemCount,
  selectCartTotal,
  selectCartLoading,
  selectCartError,
  selectIsCartEmpty,
  selectIsProductInCart,
} from '@/store/cart-store';

// In a component — only re-renders when item count changes:
const count = useCartStore(selectCartItemCount);

// Check if a specific product is already in cart:
const inCart = useCartStore(selectIsProductInCart(productId));
```

> ⚠️ **Avoid** `const { cart } = useCartStore()` in components — it re-renders on every cart change. Use the granular selectors above instead.

---

## 7. Validation Utilities

**File:** [`lib/sanitize.ts`](../lib/sanitize.ts)

```ts
import { sanitizeHtml, sanitizeText } from '@/lib/sanitize';

const safeHtml = sanitizeHtml(userInput);  // strips dangerous HTML
const safeText = sanitizeText(rawText);     // strips all HTML tags
```

**File:** [`lib/security/`](../lib/security/)

```ts
import { validateEmail, validatePhone, validateUrl } from '@/lib/security';
```

---

## 8. Pagination Helpers

### `withDefaults<T>` — Safe Pagination Params
**File:** [`lib/utils/pagination.ts`](../lib/utils/pagination.ts)

Merges caller-supplied pagination params with safe `{ page: 0, size: 10 }` defaults.

```ts
import { withDefaults } from '@/lib/utils/pagination';
import type { PageRequest, ProductFilters } from '@/types';

// In a custom query hook:
const p = withDefaults<PageRequest & ProductFilters>(params);
// Always results in at least { page: 0, size: 10 }
```

### `getPaginationCacheKey` — Stable Cache Keys
**File:** [`lib/api/client/utils.ts`](../lib/api/client/utils.ts)

Generates a deterministic, sorted query string for use as a React Query cache key.

```ts
import { getPaginationCacheKey } from '@/lib/api/client/utils';

const key = getPaginationCacheKey('/api/products', { page: 0, size: 10, category: 'shoes' });
// → "/api/products?category=shoes&page=0&size=10"
```

---

## Quick Import Reference

```ts
// Formatting
import { formatCurrency, formatDate, formatRelativeTime, truncate, cn } from '@/lib/utils';

// API helpers
import { unwrapData, withCache, withFallback, deduplicateRequest } from '@/lib/api/client/utils';

// Auth
import { useAuth, useHasRole, useRequireAuth, usePermissions } from '@/hooks/use-auth';

// UI Hooks
import { useDebounce, useLocalStorage, usePagination, useClickOutside } from '@/hooks';

// Cart selectors
import { useCartStore, selectCartItemCount, selectIsProductInCart } from '@/store/cart-store';

// Pagination
import { withDefaults } from '@/lib/utils/pagination';
```

---

*Last updated: 2026-02-22 by reusability audit.*
