# 🚀 EcomApp Frontend - Complete Architecture & Implementation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Integration](#backend-integration)
5. [API Service Layer](#api-service-layer)
6. [State Management](#state-management)
7. [Components](#components)
8. [Routing](#routing)
9. [Authentication Flow](#authentication-flow)
10. [Best Practices](#best-practices)
11. [Development Guide](#development-guide)

---

## 🎯 Overview

This is a production-ready, enterprise-grade e-commerce frontend built with Next.js 14 (App Router), React 18, TypeScript, and Tailwind CSS. It seamlessly integrates with the existing Spring Boot backend API.

### Key Features

- ✅ **Type-Safe**: Strict TypeScript throughout
- ✅ **Modern Stack**: Next.js 14 with App Router
- ✅ **State Management**: Zustand for global state
- ✅ **HTTP Client**: Axios with interceptors and retry logic
- ✅ **UI Components**: Radix UI primitives with Tailwind CSS
- ✅ **Authentication**: JWT-based auth with automatic token management
- ✅ **Error Handling**: Centralized error handling with user-friendly messages
- ✅ **Loading States**: Skeleton screens and loading indicators
- ✅ **Responsive Design**: Mobile-first, fully responsive
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Performance**: Optimized with code splitting and lazy loading

---

## 🛠 Technology Stack

### Core Technologies

- **Next.js 14.2.33** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Zustand 4.5.2** - State management
- **Axios 1.6.8** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Additional Libraries

- **axios-retry** - Automatic request retries
- **date-fns** - Date manipulation
- **lucide-react** - Icons
- **sonner** - Toast notifications
- **@tanstack/react-query** - Server state management

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (auth)/                 # Auth group (login, register)
│   │   ├── dashboard/              # Dashboard pages
│   │   ├── products/               # Product pages
│   │   ├── cart/                   # Cart page
│   │   ├── checkout/               # Checkout flow
│   │   ├── orders/                 # Order management
│   │   ├── admin/                  # Admin panel
│   │   ├── seller/                 # Seller dashboard
│   │   ├── delivery/               # Delivery agent portal
│   │   └── layout.tsx              # Root layout
│   │
│   ├── components/                 # Reusable components
│   │   ├── ui/                     # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── error-alert.tsx
│   │   ├── products/               # Product components
│   │   │   ├── product-card.tsx
│   │   │   ├── product-list.tsx
│   │   │   └── product-filters.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   └── ...                     # Other feature components
│   │
│   ├── lib/                        # Utilities and configurations
│   │   ├── axios.ts                # Axios configuration
│   │   ├── auth.ts                 # Auth helpers
│   │   ├── utils.ts                # Utility functions
│   │   └── api-client/             # API service layer
│   │       ├── index.ts            # Exports all APIs
│   │       ├── auth.ts             # Auth API
│   │       ├── products.ts         # Products API
│   │       ├── categories.ts       # Categories API
│   │       ├── brands.ts           # Brands API
│   │       ├── cart.ts             # Cart API
│   │       ├── orders.ts           # Orders API
│   │       ├── users.ts            # Users API
│   │       ├── shops.ts            # Shops API
│   │       ├── wishlist.ts         # Wishlist API
│   │       ├── reviews.ts          # Reviews API
│   │       ├── payments.ts         # Payments API
│   │       ├── coupons.ts          # Coupons API
│   │       └── dashboard.ts        # Dashboard API
│   │
│   ├── store/                      # Zustand stores
│   │   ├── auth-store.ts           # Authentication state
│   │   ├── cart-store.ts           # Cart state
│   │   ├── wishlist-store.ts       # Wishlist state
│   │   ├── products-store.ts       # Products state
│   │   ├── orders-store.ts         # Orders state
│   │   └── ui-store.ts             # UI state (modals, sidebar, etc.)
│   │
│   ├── types/                      # TypeScript types
│   │   └── index.ts                # Core types matching backend DTOs
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   └── useProducts.ts
│   │
│   └── constants/                  # Constants
│       └── index.ts
│
├── public/                         # Static assets
├── .env.local                      # Environment variables
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies
```

---

## 🔌 Backend Integration

### API Base URL

The backend API runs at `http://localhost:8080`. Configure this in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend Endpoints Summary

#### Authentication (`/api/auth/*`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user
- `POST /refresh` - Refresh token
- `POST /logout` - Logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `POST /change-password` - Change password

#### Products (`/api/products/*`)
- `GET /products` - List products (paginated)
- `GET /products/{id}` - Get product by ID
- `GET /products/search` - Search products
- `POST /products` - Create product (Seller/Admin)
- `PUT /products/{id}` - Update product (Seller/Admin)
- `DELETE /products/{id}` - Delete product (Seller/Admin)

#### Cart (`/api/cart/*`)
- `GET /cart` - Get current user's cart
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/{id}` - Update cart item
- `DELETE /cart/items/{id}` - Remove item from cart
- `DELETE /cart/clear` - Clear cart

#### Orders (`/api/orders/*`)
- `POST /orders` - Create order
- `GET /orders/my-orders` - Get user's orders
- `GET /orders/{id}` - Get order by ID
- `PUT /orders/{id}/status` - Update order status

#### Users (`/api/users/*`)
- `GET /users/me` - Get current user
- `PUT /users/me` - Update profile
- `PUT /users/me/password` - Change password
- `GET /users` - List users (Admin)

For complete API documentation, see [API_DOCUMENTATION.md](../documentation/frontend/01_API_DOCUMENTATION.md)

---

## 🎯 API Service Layer

### Architecture

All API calls go through a centralized service layer in `src/lib/api-client/`. Each service module corresponds to a backend controller.

### Example: Auth API

```typescript
// src/lib/api-client/auth.ts
import { apiClient } from '../axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data.data;
  },

  getCurrentUser: async (): Promise<UserDTO> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data.data;
  },
};
```

### Usage in Components

```typescript
'use client';

import { authApi } from '@/features/auth (or specific feature)';
import { useAuthStore } from '@/store/auth-store';

export function LoginForm() {
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      router.push('/dashboard');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  return <form onSubmit={handleSubmit(handleLogin)}>...</form>;
}
```

### Axios Configuration

**Location**: `src/lib/axios.ts`

Features:
- Automatic JWT token injection
- Request/response interceptors
- Retry logic for failed requests
- Error handling and 401 redirect
- Development logging

```typescript
// Request Interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🗃 State Management

### Zustand Stores

We use Zustand for global state management. Each store handles a specific domain.

#### Auth Store

**Location**: `src/store/auth-store.ts`

```typescript
interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setUser: (user: UserDTO) => void;
  logout: () => void;
  initialize: () => void;
}
```

#### Cart Store

**Location**: `src/store/cart-store.ts`

```typescript
interface CartState {
  items: CartItemDTO[];
  totalAmount: number;
  isLoading: boolean;
  
  addItem: (item: AddToCartRequest) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}
```

### Usage Example

```typescript
'use client';

import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';

export function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartItemsCount = useCartStore((state) => state.items.length);

  return (
    <header>
      <span>Welcome, {user?.firstName}</span>
      <button onClick={logout}>Logout</button>
      <Badge>{cartItemsCount}</Badge>
    </header>
  );
}
```

---

## 🧩 Components

### Component Architecture

- **UI Components** (`components/ui/`) - Reusable, generic components
- **Feature Components** (`components/[feature]/`) - Domain-specific components
- **Layout Components** (`components/layout/`) - Layout wrappers

### Key Components

#### Button

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg" isLoading={loading}>
  Submit
</Button>
```

**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes**: `default`, `sm`, `lg`, `icon`

#### Card

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Product Card

```typescript
import { ProductCard } from '@/components/products/product-card';

<ProductCard product={product} />
```

Features:
- Image display with fallback
- Add to cart button
- Wishlist toggle
- Price display with discount
- Stock status

---

## 🛣 Routing

### App Router Structure

```
app/
├── (auth)/                 # Auth routes (no layout)
│   ├── login/
│   └── register/
├── dashboard/              # Protected dashboard
├── products/               # Product pages
│   ├── page.tsx           # /products
│   └── [id]/              # /products/:id
├── cart/                   # Cart page
├── checkout/               # Checkout flow
├── orders/                 # Order history
│   ├── page.tsx           # /orders
│   └── [id]/              # /orders/:id
├── admin/                  # Admin panel (protected)
├── seller/                 # Seller dashboard (protected)
└── delivery/               # Delivery agent (protected)
```

### Route Groups

- `(auth)` - Authentication pages without main layout
- `dashboard` - User dashboard with sidebar layout
- `admin` - Admin-only pages
- `seller` - Seller-only pages

### Protected Routes

Use the proxy-based approach for route protection (see `src/proxy.ts`). The project provides a `middleware.ts` shim that delegates to the proxy for Next.js compatibility.

See `src/proxy.ts` for the full route protection logic (session extraction, RBAC, security headers, and matcher configuration).

---

## 🔐 Authentication Flow

### Login Flow

1. User submits login form
2. Frontend calls `authApi.login()`
3. Backend validates credentials and returns JWT + user data
4. Frontend stores token in localStorage
5. Frontend updates auth store with user data
6. Frontend redirects to dashboard

```typescript
const handleLogin = async (data: LoginRequest) => {
  try {
    const response = await authApi.login(data);
    
    // Store token
    localStorage.setItem('token', response.token);
    
    // Update auth store
    useAuthStore.getState().setUser(response.user);
    
    // Redirect
    router.push('/dashboard');
  } catch (error) {
    toast.error('Invalid credentials');
  }
};
```

### Registration Flow

1. User fills registration form (role-specific fields)
2. Frontend validates with Zod schema
3. Frontend calls `authApi.register()`
4. Backend creates user and returns JWT + user data
5. Same as login steps 4-6

### Token Management

- Tokens stored in localStorage
- Automatically added to all requests via Axios interceptor
- 401 responses trigger automatic logout and redirect
- Refresh token flow (if implemented)

### Role-Based Access

```typescript
// Check role in component
const user = useAuthStore((state) => state.user);

if (user?.role === UserRole.ADMIN) {
  // Show admin features
}
```

---

## ✅ Best Practices

### 1. **Type Safety**

Always use TypeScript interfaces matching backend DTOs:

```typescript
// ✅ Good
const product: ProductDTO = await productsApi.getById(id);

// ❌ Bad
const product: any = await productsApi.getById(id);
```

### 2. **Error Handling**

Always handle errors with try-catch and user feedback:

```typescript
try {
  await productsApi.create(data);
  toast.success('Product created');
} catch (error) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  toast.error(message);
}
```

### 3. **Loading States**

Show loading indicators during async operations:

```typescript
const [isLoading, setIsLoading] = useState(false);

const loadData = async () => {
  setIsLoading(true);
  try {
    const data = await api.getData();
    setState(data);
  } finally {
    setIsLoading(false);
  }
};
```

### 4. **Component Composition**

Break down large components into smaller, reusable pieces:

```typescript
// ProductPage.tsx
<ProductList products={products} />
<ProductFilters onFilterChange={handleFilterChange} />
<Pagination page={page} onPageChange={setPage} />
```

### 5. **API Client Usage**

Always use the API client layer, never call axios directly:

```typescript
// ✅ Good
import { productsApi } from '@/features/auth (or specific feature)';
const products = await productsApi.getAll();

// ❌ Bad
import axios from 'axios';
const response = await axios.get('/api/products');
```

---

## 🚀 Development Guide

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Backend API Documentation](../documentation/frontend/01_API_DOCUMENTATION.md)

---

## 🎉 Summary

This frontend is a **production-ready**, **type-safe**, **scalable** solution that seamlessly integrates with the Spring Boot backend. It follows modern React and Next.js best practices, uses Zustand for state management, Axios for HTTP requests, and Radix UI components styled with Tailwind CSS.

**Key Achievements:**
- ✅ Complete API integration with all backend endpoints
- ✅ Type-safe API service layer
- ✅ Centralized state management with Zustand
- ✅ Reusable UI components with Radix UI
- ✅ Role-based authentication and routing
- ✅ Comprehensive error handling and loading states
- ✅ Responsive, accessible design
- ✅ Performance optimized

**Next Steps:**
1. Run `npm install` to install dependencies
2. Configure `.env.local` with backend URL
3. Start development server with `npm run dev`
4. Begin building your features!

---

**Built with ❤️ by Senior Full-Stack Architect**
