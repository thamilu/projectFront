# EcomApp Frontend Documentation

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Service Worker (PWA)](#service-worker-pwa)
- [Environment Configuration](#environment-configuration)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Scripts Reference](#scripts-reference)

---

## Overview

Enterprise-grade Next.js 16 ecommerce frontend built with:

- **Framework**: Next.js 16.1.0 (App Router)
- **Language**: TypeScript 5.9.3
- **UI**: React 19.2.3, Tailwind CSS 4.1.18, shadcn/ui
- **State Management**: Zustand 5.0.9 (local state), TanStack Query 5.90.12 (server state)
- **Authentication**: Keycloak OAuth2/OIDC with PKCE
- **Backend**: Spring Boot API (port 8082)
- **PWA**: TypeScript Service Worker with IndexedDB
- **Node**: >= 24.12.0 required

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy example and edit with your values
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8082
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.com
NEXT_PUBLIC_KEYCLOAK_REALM=your-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=your-client-id
```

### 3. Verify Setup

```bash
npm run check:env      # Validate environment variables
npm run check:keycloak # Verify Keycloak connectivity
```

### 4. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout with providers
│   │   ├── providers.tsx    # React Query, Theme providers
│   │   └── [routes]/        # Page routes
│   ├── components/          # Reusable UI components (shadcn/ui)
│   ├── features/            # Feature-based modules
│   │   ├── auth/            # Authentication components
│   │   ├── products/        # Product catalog
│   │   ├── cart/            # Shopping cart
│   │   ├── orders/          # Order management
│   │   └── wishlist/        # User wishlist
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication state
│   │   ├── useLogin.ts      # Login mutation
│   │   └── useLogout.ts     # Logout mutation
│   ├── lib/                 # Shared utilities
│   │   ├── axios.ts         # HTTP client with interceptors
│   │   ├── api-client.ts    # API helpers
│   │   └── auth.ts          # Auth utilities
│   ├── store/               # Zustand stores
│   │   ├── auth-store.ts    # Auth state
│   │   └── cart-store.ts    # Cart state
│   ├── types/               # TypeScript type definitions
│   ├── sw/                  # Service Worker source
│   │   ├── service-worker.ts # TypeScript service worker
│   │   └── README.md        # Service worker docs
│   └── scripts/             # Build & validation scripts
├── public/
│   ├── service-worker.js    # Compiled service worker (gitignored)
│   ├── sw.js                # Deprecated (use service-worker.js)
│   └── manifest.json        # PWA manifest
├── .github/
│   └── workflows/           # CI/CD workflows
│       └── check-icons.yml  # Lucide icon validation
├── scripts/                 # Node.js scripts
│   ├── generate-lucide-types.ts  # Icon type generator
│   ├── validate-env.ts      # Environment validator
│   └── verify-keycloak-setup.ts  # Keycloak checker
├── next.config.js           # Next.js configuration
├── tsconfig.json            # TypeScript config (app)
├── tsconfig.sw.json         # TypeScript config (service worker)
└── package.json             # Dependencies & scripts
```

---

## Development

### Development Server

```bash
npm run dev
```

- Hot reload enabled
- Runs on **http://localhost:3000**
- API proxied from **http://localhost:8082**

### Key Development Features

- **App Router**: Server and client components
- **API Rewrites**: `/api/*` → `http://localhost:8082/*` (configured in `next.config.js`)
- **Type Safety**: Full TypeScript with strict mode
- **React Query**: Server state management with automatic caching
- **Zustand**: Local UI state
- **Axios Interceptors**: Automatic token refresh, error handling

### Code Quality

```bash
npm run type-check  # TypeScript validation
npm run lint        # ESLint checks
npm run format      # Prettier formatting
```

### File Conventions

- **Server Components**: Default in `app/` directory
- **Client Components**: Add `'use client'` directive
- **API Types**: Match backend DTOs in `src/types/`
- **Validation**: Zod schemas in feature directories

---

## Build & Deployment

### Production Build

```bash
npm run build
```

This runs:
1. `npm run build:sw` - Compiles TypeScript service worker
2. `next build` - Builds Next.js production bundle

### Production Server

```bash
npm run start
```

Runs on **http://localhost:3000**

### Build Configuration

**Security Features** (configured in `next.config.js`):
- Client-side code obfuscation (webpack-obfuscator)
- Source maps disabled in production
- Sentry error tracking integration

### CI/CD

Pre-deployment checks:
```bash
npm run ci:preflight  # Runs check:env
```

---

## Service Worker (PWA)

### Architecture

**DO NOT edit `/public/service-worker.js` directly!**

The service worker is written in TypeScript:

```
Source:  src/sw/service-worker.ts
Output:  public/service-worker.js (compiled, gitignored)
Config:  tsconfig.sw.json
```

### Build Service Worker

```bash
npm run build:sw
```

Automatically runs during `npm run build`.

### Features

- ✅ **IndexedDB Storage**: Uses `idb-keyval` (localStorage unavailable in SW)
- ✅ **Smart Caching**:
  - Network-first for HTML (dynamic content)
  - Cache-first for `/_next/static/*` (immutable assets)
  - Never caches `/api/*` routes
  - Never caches authenticated routes (`/cart`, `/orders`, `/wishlist`)
- ✅ **Background Sync**: Cart and wishlist sync with retry logic
- ✅ **Push Notifications**: Web Push API integration
- ✅ **Authentication**: `credentials: 'include'` for authenticated requests
- ✅ **Cache Management**: Automatic cleanup of old caches

### Service Worker Registration

Update your app initialization:

```typescript
// app/layout.tsx or app/page.tsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

### Configuration

Edit constants in `src/sw/service-worker.ts`:

```typescript
const SW_CONFIG = {
  CACHE_NAME: 'eshop-cache-v2',
  STATIC_URLS: ['/', '/products', '/offline'],
  STATIC_PREFIX: '/_next/static/',
  // ... more config
};
```

### Offline Support

Requires `/offline` page:

```typescript
// app/offline/page.tsx
export default function OfflinePage() {
  return <div>You are offline. Please check your connection.</div>;
}
```

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8082` |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Keycloak server | `https://auth.example.com` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Keycloak realm | `ecommerce` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | OAuth client ID | `ecommerce-frontend` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | (disabled) |
| `SENTRY_ORG` | Sentry organization | - |
| `SENTRY_PROJECT` | Sentry project | - |

### Validation

```bash
npm run check:env       # Validate all required variables
npm run check:keycloak  # Test Keycloak connectivity
```

### File Locations

- `.env.local` - Local development (gitignored)
- `.env.production` - Production environment (gitignored)
- `.env.example` - Template with all variables

⚠️ **Never commit `.env` files with secrets!**

---

## Authentication

### Implementation

Full OAuth2/OIDC with PKCE flow (see `KEYCLOAK_AUTH_IMPLEMENTATION.md`).

### Auth Hooks

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useLogin } from '@/hooks/useLogin';
import { useLogout } from '@/hooks/useLogout';

// Get current auth state
const { user, isAuthenticated, isLoading } = useAuth();

// Login
const login = useLogin();
login.mutate({ username, password });

// Logout
const logout = useLogout();
logout.mutate();
```

### Token Management

- **Storage**: `localStorage` (access token, refresh token)
- **Refresh**: Automatic via axios interceptor (`src/lib/axios.ts`)
- **Format**: JWT with `expires_in` field
- **Cookies**: HTTP-only for backend requests

### Protected Routes

```typescript
// app/protected/page.tsx
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    redirect('/login');
  }
  
  return <div>Protected content</div>;
}
```

---

## API Integration

### HTTP Client

Centralized axios instance with interceptors:

```typescript
// src/lib/axios.ts
import { apiClient } from '@/features/auth (or specific feature)';

// Automatic features:
// - Token injection
// - Token refresh on 401
// - Error handling
// - Base URL from env
```

### Making API Calls

**With React Query:**

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/features/auth (or specific feature)';

// Query
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: () => apiClient.get('/api/products'),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/api/cart', data),
  onSuccess: () => {
    // Invalidate queries, show toast, etc.
  },
});
```

### API Proxying

Configured in `next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8082/:path*'
    }
  ];
}
```

All requests to `/api/*` are proxied to the backend.

---

## Testing

### Unit Tests

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

**Framework**: Jest with ts-jest

**Example Test:**

```typescript
// src/hooks/__tests__/useAuth.test.ts
import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('returns authenticated state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### Icon Type Validation

```bash
npm run check:icons   # Verify Lucide icon types are current
npm run gen:lucide-types  # Regenerate icon types
```

### CI Workflows

- **Icon Check**: `.github/workflows/check-icons.yml`
  - Runs on push to `src/**` or `scripts/**`
  - Validates icon type generation

---

## Scripts Reference

### Development

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run type-check` | TypeScript validation |
| `npm run lint` | ESLint code quality checks |
| `npm run format` | Format code with Prettier |
| `npm test` | Run Jest tests |

### Build & Deploy

| Script | Description |
|--------|-------------|
| `npm run build` | Production build (SW + Next.js) |
| `npm run build:sw` | Compile service worker only |
| `npm run start` | Start production server |
| `npm run ci:preflight` | Pre-deployment validation |
| `npm run predeploy` | Runs before deployment |

### Validation

| Script | Description |
|--------|-------------|
| `npm run check:env` | Validate environment variables |
| `npm run check:keycloak` | Test Keycloak connectivity |
| `npm run check:icons` | Verify icon types are current |

### Code Generation

| Script | Description |
|--------|-------------|
| `npm run gen:lucide-types` | Generate Lucide icon types |

---

## Troubleshooting

### Service Worker Not Updating

```bash
# Rebuild service worker
npm run build:sw

# Hard refresh browser: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
# Or unregister in DevTools > Application > Service Workers
```

### Type Errors

```bash
# Check TypeScript errors
npm run type-check

# Check service worker types separately
npx tsc --noEmit --project tsconfig.sw.json
```

### Environment Variables Not Loading

```bash
# Validate configuration
npm run check:env

# Ensure .env.local exists and has all required variables
# Restart dev server after changing .env files
```

### API Requests Failing

1. Ensure backend is running on port 8082
2. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Verify API rewrites in `next.config.js`
4. Check browser DevTools Network tab

### Auth Issues

```bash
# Verify Keycloak setup
npm run check:keycloak

# Check token storage in browser DevTools > Application > Local Storage
# Ensure Keycloak realm and client ID are correct
```

---

## Additional Resources

- **Auth Documentation**: `KEYCLOAK_AUTH_IMPLEMENTATION.md`
- **Service Worker Guide**: `src/sw/README.md`
- **Project README**: `README.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

## Support & Contributing

For questions or contributions, refer to the project's GitHub repository.

**Last Updated**: December 26, 2025
