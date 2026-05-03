# DRY Utilities - Quick Reference Guide

## Import Statement

```typescript
import {
  // Fetch utilities
  safeFetch,
  authenticatedFetch,
  buildUrl,

  // Error handling
  handleError,
  getUserFriendlyMessage,

  // API clients
  cartApi,
  productsApi,
  ordersApi,
  dashboardApi,
} from '@/lib/utils';
```

## Common Patterns

### 1. Simple GET Request

**Before:**

```typescript
const response = await fetch('/api/products');
const data = await response.json();
```

**After:**

```typescript
const data = await safeFetch('/api/products');
```

### 2. Authenticated Request

**Before:**

```typescript
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
if (!response.ok) throw new Error('Request failed');
const data = await response.json();
```

**After:**

```typescript
const data = await authenticatedFetch(url, { accessToken });
```

### 3. POST Request

**Before:**

```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
if (!response.ok) throw new Error('Request failed');
const data = await response.json();
```

**After:**

```typescript
const data = await authenticatedFetch(url, {
  method: 'POST',
  accessToken,
  body: JSON.stringify(payload),
});
```

### 4. Error Handling

**Before:**

```typescript
try {
  await operation();
} catch (error) {
  console.error('Error:', error);
  toast.error('Operation failed');
}
```

**After:**

```typescript
try {
  await operation();
} catch (error) {
  handleError(error, 'Operation failed');
  toast.error(getUserFriendlyMessage(error));
}
```

### 5. Cart Operations

**Before:**

```typescript
const response = await fetch(`${API_URL}/cart`, {
  headers: { Authorization: `Bearer ${token}` },
});
const cart = await response.json();
```

**After:**

```typescript
const cart = await cartApi.getCart(token);
```

### 6. URL with Query Parameters

**Before:**

```typescript
const params = new URLSearchParams({ page: '1', limit: '10' });
const url = `/api/products?${params.toString()}`;
```

**After:**

```typescript
const url = buildUrl('/api/products', { page: 1, limit: 10 });
```

### 7. Token Storage

**Before:**

```typescript
if (data.access_token) tokenStorage.setTokens(data.access_token, data.refresh_token);
if (data.expires_in) tokenStorage.setTokenExpiry(data.expires_in);
if (data.id_token) localStorage.setItem('id_token', data.id_token);
```

**After:**

```typescript
import { storeTokens } from '@/lib/utils';
storeTokens(data, tokenStorage);
```

## API Client Examples

### Cart API

```typescript
// Get cart
const cart = await cartApi.getCart(accessToken);

// Add item
await cartApi.addItem(accessToken, productId, quantity);

// Update quantity
await cartApi.updateQuantity(accessToken, itemId, newQuantity);

// Remove item
await cartApi.removeItem(accessToken, itemId);
```

### Products API

```typescript
// Get all products
const products = await productsApi.getAll({ page: 1, limit: 20 });

// Get by ID
const product = await productsApi.getById(123);

// Search
const results = await productsApi.search('laptop');
```

### Orders API

```typescript
// Seller orders
const orders = await ordersApi.getSellerOrders(accessToken);

// Customer orders
const orders = await ordersApi.getCustomerOrders(accessToken);

// Get by ID
const order = await ordersApi.getById(accessToken, orderId);
```

### Dashboard API

```typescript
// Seller dashboard
const data = await dashboardApi.getSeller(accessToken);

// Customer dashboard
const data = await dashboardApi.getCustomer(accessToken);

// Admin dashboard
const data = await dashboardApi.getAdmin(accessToken);
```

## Error Types

```typescript
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
} from '@/lib/utils';

// Check error type
catch (error) {
  if (error instanceof AuthenticationError) {
    // Redirect to login
  } else if (error instanceof ValidationError) {
    // Show validation errors
  }
}
```

## Advanced Usage

### Retry with Custom Options

```typescript
import { retryFetch } from '@/lib/utils';

const data = await retryFetch('/api/data', {
  retries: 3,
  retryDelay: 2000,
  timeout: 15000,
});
```

### Custom API Client

```typescript
import { createApiClient } from '@/lib/utils';

const myApi = createApiClient('/my-endpoint');

// Use it
const data = await myApi.get(accessToken);
await myApi.post(accessToken, payload);
await myApi.put(accessToken, payload, '/123');
await myApi.delete(accessToken, '/123');
```

### Try-Catch Wrapper

```typescript
import { tryCatch } from '@/lib/utils';

const result = await tryCatch(async () => await fetchData(), 'Failed to fetch data');

if (result === null) {
  // Handle error (already logged)
}
```

## Tips

1. **Always use utilities over raw fetch**
2. **Use pre-configured API clients when available**
3. **Handle errors consistently with handleError()**
4. **Show user-friendly messages with getUserFriendlyMessage()**
5. **Extract tokens with storeTokens() utility**

## Migration Checklist

When refactoring existing code:

- [ ] Replace `fetch()` with `safeFetch()` or `authenticatedFetch()`
- [ ] Replace manual error handling with `handleError()`
- [ ] Replace error messages with `getUserFriendlyMessage()`
- [ ] Use pre-configured API clients (`cartApi`, `ordersApi`, etc.)
- [ ] Replace token storage with `storeTokens()`
- [ ] Remove duplicate try-catch blocks
- [ ] Test thoroughly

## See Also

- Full documentation: `docs/DRY_REFACTORING.md`
- Implementation summary: `DRY_IMPLEMENTATION_SUMMARY.md`
