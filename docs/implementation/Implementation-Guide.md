# 🎯 Frontend Implementation - Quick Start Guide

## ✅ What Has Been Implemented

### 1. **API Service Layer** (Feature-based in `features/*/api/`)

Complete, type-safe API client for all backend endpoints:

- ✅ `auth.ts` - Authentication (login, register, logout, password reset)
- ✅ `products.ts` - Products CRUD, search, filtering
- ✅ `categories.ts` - Category management
- ✅ `brands.ts` - Brand management
- ✅ `cart.ts` - Shopping cart operations
- ✅ `orders.ts` - Order management
- ✅ `users.ts` - User profile and admin operations
- ✅ `shops.ts` - Shop management
- ✅ `wishlist.ts` - Wishlist operations
- ✅ `reviews.ts` - Product reviews
- ✅ `payments.ts` - Payment processing
- ✅ `coupons.ts` - Coupon management
- ✅ `dashboard.ts` - Dashboard data

**Key Features:**

- All methods return typed responses
- Automatic JWT token injection
- Error handling with meaningful messages
- Retry logic for failed requests

### 2. **Zustand Stores** (`src/store/`)

Global state management:

- ✅ `auth-store.ts` - User authentication state
- ✅ `cart-store.ts` - Shopping cart state (already exists)
- ✅ `wishlist-store.ts` - Wishlist state (already exists)
- ✅ `products-store.ts` - Product filtering state
- ✅ `orders-store.ts` - Orders state
- ✅ `ui-store.ts` - UI state (modals, sidebar, theme)

### 3. **UI Components** (`src/components/ui/`)

Reusable components with Radix UI:

- ✅ `button.tsx` - Button with variants and loading states (already exists)
- ✅ `card.tsx` - Card container (already exists)
- ✅ `input.tsx` - Input field (already exists)
- ✅ `loading.tsx` - Loading spinners
- ✅ `empty-state.tsx` - Empty state display
- ✅ `error-alert.tsx` - Error messages

### 4. **Feature Components** (`src/components/`)

Domain-specific components:

- ✅ `products/product-card.tsx` - Product card with add to cart/wishlist
- ✅ `products/product-list.tsx` - Product grid with loading states
- ✅ `products/product-filters.tsx` - Advanced product filters

### 5. **Axios Configuration** (`src/lib/axios.ts`)

Already exists with:

- JWT token injection
- Request/response interceptors
- Retry logic
- Error handling

### 6. **TypeScript Types** (`src/types/index.ts`)

Already complete with all DTOs matching backend

---

## 🚀 Next Steps - Implementation Checklist

### Priority 1: Authentication Pages

1. **Update Login Page** (`app/auth/login/page.tsx`)

   ```typescript
   import { authApi } from '@/features/auth (or specific feature)';
   // Use authApi.login() instead of existing implementation
   ```

2. **Update Register Page** (`app/auth/register/page.tsx`)
   ```typescript
   import { authApi } from '@/features/auth (or specific feature)';
   // Use authApi.register() instead of existing implementation
   ```

### Priority 2: Products

3. **Products List Page** (`app/products/page.tsx`)

   ```typescript
   import { productsApi } from '@/features/auth (or specific feature)';
   import { ProductList } from '@/components/products/product-list';
   import { ProductFilters } from '@/components/products/product-filters';

   const products = await productsApi.getAll({ page, size, ...filters });
   ```

4. **Product Detail Page** (`app/products/[id]/page.tsx`)

   ```typescript
   import { productsApi } from '@/features/auth (or specific feature)';

   const product = await productsApi.getById(id);
   ```

### Priority 3: Cart & Checkout

5. **Cart Page** (`app/cart/page.tsx`)

   ```typescript
   import { cartApi } from '@/features/auth (or specific feature)';
   import { useCartStore } from '@/store/cart-store';
   ```

6. **Checkout Page** (`app/checkout/page.tsx`)
   ```typescript
   import { ordersApi, paymentsApi } from '@/features/auth (or specific feature)';
   ```

### Priority 4: Dashboard

7. **Dashboard Pages** (already have basic structure)
   - Update to use `dashboardApi.getDashboard()`
   - Add role-specific widgets
   - Add charts and statistics

### Priority 5: Admin Panel

8. **Admin Pages** (`app/admin/`)
   - Users management
   - Products management
   - Orders management
   - Analytics

### Priority 6: Seller Dashboard

9. **Seller Pages** (`app/seller/`)
   - My products
   - My orders
   - Shop settings
   - Analytics

---

## 📦 Installation & Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already done)
npm install

# 3. Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:3000
```

---

## 🔧 How to Use the API Client

### Example 1: Fetch Products

```typescript
'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/features/auth (or specific feature)';
import { ProductDTO } from '@/types';
import { ProductList } from '@/components/products/product-list';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll({ page: 0, size: 20 });
      setProducts(data.content);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Products</h1>
      <ProductList products={products} isLoading={isLoading} />
    </div>
  );
}
```

### Example 2: Add to Cart

```typescript
'use client';

import { cartApi } from '@/features/auth (or specific feature)';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

export function AddToCartButton({ productId }: { productId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const refreshCart = useCartStore((state) => state.fetchCart);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await cartApi.addItem({ productId, quantity: 1 });
      await refreshCart(); // Refresh cart state
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleAddToCart} disabled={isLoading}>
      {isLoading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

### Example 3: Login

```typescript
'use client';

import { authApi } from '@/features/auth (or specific feature)';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);

      // Store token
      localStorage.setItem('token', response.token!);

      // Update auth store
      setUser(response.user!, true);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };

  return <form onSubmit={handleSubmit(handleLogin)}>...</form>;
}
```

---

## 🎨 Using Components

### Product Card

```typescript
import { ProductCard } from '@/components/products/product-card';

<ProductCard product={product} />
```

### Product List with Filters

```typescript
import { ProductList } from '@/components/products/product-list';
import { ProductFilters } from '@/components/products/product-filters';

<div className="flex gap-6">
  <aside className="w-64">
    <ProductFilters
      categories={categories}
      brands={brands}
      onFilterChange={handleFilterChange}
    />
  </aside>
  <main className="flex-1">
    <ProductList products={products} isLoading={isLoading} />
  </main>
</div>
```

### Loading States

```typescript
import { LoadingSpinner, LoadingPage } from '@/components/ui/loading';

// For sections
{isLoading && <LoadingSpinner size="lg" />}

// For full page
{isLoading && <LoadingPage />}
```

### Empty States

```typescript
import { EmptyState } from '@/components/ui/empty-state';

<EmptyState
  icon={<Package className="h-12 w-12" />}
  title="No Products"
  description="Start adding products to see them here"
  action={{
    label: "Add Product",
    onClick: () => router.push('/seller/products/new')
  }}
/>
```

---

## 🔐 Authentication Flow

### 1. Login

```typescript
const response = await authApi.login({ usernameOrEmail, password });
localStorage.setItem('token', response.token);
useAuthStore.getState().setUser(response.user);
```

### 2. Register

```typescript
const response = await authApi.register(registerData);
localStorage.setItem('token', response.token);
useAuthStore.getState().setUser(response.user);
```

### 3. Logout

```typescript
await authApi.logout();
useAuthStore.getState().logout();
router.push('/auth/login');
```

### 4. Check Authentication

```typescript
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

if (!isAuthenticated) {
  router.push('/auth/login');
}
```

---

## 📊 State Management

### Using Zustand Stores

```typescript
// Read state
const user = useAuthStore((state) => state.user);
const items = useCartStore((state) => state.items);

// Update state
const setUser = useAuthStore((state) => state.setUser);
const addItem = useCartStore((state) => state.addItem);

// Call actions
await addItem({ productId: 1, quantity: 2 });
```

---

## 🧪 Testing the Implementation

### Test Checklist

1. **Authentication**
   - [ ] Login works
   - [ ] Register works
   - [ ] Logout works
   - [ ] Protected routes redirect to login

2. **Products**
   - [ ] Products list loads
   - [ ] Product detail page works
   - [ ] Search works
   - [ ] Filters work
   - [ ] Add to cart works

3. **Cart**
   - [ ] View cart
   - [ ] Add items
   - [ ] Update quantities
   - [ ] Remove items
   - [ ] Clear cart

4. **Orders**
   - [ ] Create order
   - [ ] View orders
   - [ ] Track order status

5. **Dashboard**
   - [ ] Loads role-specific data
   - [ ] Displays statistics
   - [ ] Shows recent activity

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized

**Solution:** Token not stored correctly

```typescript
// After login
localStorage.setItem('token', response.token);

// Verify token is set
const token = localStorage.getItem('token');
console.log('Token:', token);
```

### Issue: CORS Errors

**Solution:** Configure backend CORS

```java
// Spring Boot
@CrossOrigin(origins = "http://localhost:3000")
```

### Issue: API calls fail

**Solution:** Check API URL in .env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 📖 Documentation

- **Full Architecture**: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
- **API Documentation**: [../documentation/frontend/01_API_DOCUMENTATION.md](../documentation/frontend/01_API_DOCUMENTATION.md)
- **Backend API**: [../documentation/backend/README.md](../documentation/backend/README.md)

---

## ✅ Summary

**Completed:**

- ✅ Complete API client layer for all endpoints
- ✅ Zustand stores for state management
- ✅ Reusable UI components
- ✅ Product display components
- ✅ Type-safe TypeScript throughout
- ✅ Axios with interceptors and retry logic
- ✅ Error handling and loading states

**Next Steps:**

1. Update existing pages to use new API client
2. Build remaining pages (checkout, admin, seller)
3. Add more feature components as needed
4. Test all flows end-to-end

---

**Ready to build! 🚀**
