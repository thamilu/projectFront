# 🎯 Quick Start Guide - Enterprise Structure

## ⚠️ Important: Understanding the `app/` Folder

**The `app/` folder IS essential and part of the enterprise structure!**

- `app/` = **ROUTES ONLY** (required by Next.js, defines navigation)
- `features/` = **BUSINESS LOGIC** (where your code lives)
- `components/` = **SHARED UI** (reusable components)

📖 **Must Read:** [APP_FOLDER_EXPLAINED.md](./APP_FOLDER_EXPLAINED.md)

## 📂 New Project Structure

Your project now follows **enterprise best practices** with a feature-first, domain-driven architecture.

## 🚀 Key Changes

### 1. **Feature Modules** (`features/`)
Each business domain is now a self-contained module:

```
features/
├── auth/          # Authentication & Authorization
├── products/      # Product Management
├── cart/          # Shopping Cart
├── orders/        # Order Management
├── payments/      # Payment Processing
├── seller/        # Seller Dashboard
└── users/         # User Management
```

**Each feature has:**
- `api/` - API calls
- `components/` - Feature-specific components
- `hooks/` - Feature-specific hooks
- `types/` - TypeScript types
- `schemas/` - Zod validation
- `index.ts` - Public exports

### 2. **Centralized Configuration** (`config/`)

```typescript
// Import app config
import { appConfig, routes, env } from '@/config';

// Use routes
router.push(routes.products);
router.push(routes.seller.dashboard);

// Use app config
console.log(appConfig.api.baseUrl);
```

### 3. **Organized Library** (`lib/`)

```
lib/
├── api/           # API clients
├── auth/          # Auth utilities
├── utils/         # General utilities
└── validation/    # Validation logic
```

### 4. **Testing Structure**

```
__tests__/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── setup.ts       # Test configuration

e2e/               # End-to-end tests
├── auth.spec.ts
└── ...
```

## 📝 How to Use

### Import from Features

```typescript
// ✅ Good - Import from feature public API
import { useAuth, LoginForm } from '@/features/auth';
import { ProductCard, useProducts } from '@/features/products';
import { useCart } from '@/features/cart';

// ❌ Avoid - Don't import internal files
import { LoginForm } from '@/features/auth/components/LoginForm';
```

### Import from Config

```typescript
import { routes, appConfig } from '@/config';

// Navigate using routes
router.push(routes.products);
router.push(routes.admin.dashboard);

// Use configuration
fetch(appConfig.api.baseUrl + '/products');
```

### Import Shared Components

```typescript
import { Button, Card, Input } from '@/components/ui';
import { Header, Sidebar } from '@/components/layout';
```

## 🏗️ Adding a New Feature

1. **Create feature folder:**
```bash
mkdir -p features/my-feature/{api,components,hooks,types,schemas}
```

2. **Create index.ts:**
```typescript
// features/my-feature/index.ts
export * from './components/MyComponent';
export * from './hooks/useMyFeature';
export * from './api/my-api';
export type * from './types/my-feature.types';
```

3. **Add API:**
```typescript
// features/my-feature/api/my-api.ts
import { apiClient } from '@/lib/axios';

export const myFeatureApi = {
  getAll: async () => {
    const response = await apiClient.get('/my-feature');
    return response.data.data;
  },
};
```

4. **Add Hook:**
```typescript
// features/my-feature/hooks/useMyFeature.ts
import { useQuery } from '@tanstack/react-query';
import { myFeatureApi } from '../api/my-api';

export function useMyFeature() {
  return useQuery({
    queryKey: ['my-feature'],
    queryFn: myFeatureApi.getAll,
  });
}
```

5. **Add Component:**
```typescript
// features/my-feature/components/MyComponent.tsx
import { useMyFeature } from '../hooks/useMyFeature';

export function MyComponent() {
  const { data, isLoading } = useMyFeature();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{/* Your component */}</div>;
}
```

6. **Use in app:**
```typescript
// app/my-feature/page.tsx
import { MyComponent } from '@/features/my-feature';

export default function MyFeaturePage() {
  return <MyComponent />;
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test                  # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage
```

### E2E Tests
```bash
npm run test:e2e              # Run E2E tests
npm run test:e2e:ui           # With UI
```

### Writing Tests
```typescript
// __tests__/unit/features/auth/useAuth.test.ts
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/features/auth';

describe('useAuth', () => {
  it('returns auth state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toBeDefined();
  });
});
```

## 📊 Project Commands

```bash
# Development
npm run dev                   # Start dev server
npm run build                 # Build for production
npm run start                 # Start production server

# Code Quality
npm run lint                  # Lint code
npm run lint:fix              # Fix lint issues
npm run type-check            # Check TypeScript
npm run format                # Format code

# Testing
npm run test                  # Run unit tests
npm run test:e2e              # Run E2E tests
npm run validate              # Run all checks

# Utilities
npm run check:env             # Validate environment
npm run check:keycloak        # Check Keycloak setup
```

## 📚 Documentation

- **[ENTERPRISE_STRUCTURE.md](./ENTERPRISE_STRUCTURE.md)** - Full architecture guide
- **[KEYCLOAK_AUTH_IMPLEMENTATION.md](./KEYCLOAK_AUTH_IMPLEMENTATION.md)** - Auth implementation
- **[README.md](./README.md)** - Original project README

## 🎨 Benefits of This Structure

✅ **Scalability** - Easy to add new features without affecting existing code  
✅ **Maintainability** - Clear organization makes code easy to find and update  
✅ **Testability** - Each feature can be tested independently  
✅ **Team Collaboration** - Multiple developers can work on different features  
✅ **Reusability** - Shared components and utilities are clearly separated  
✅ **Type Safety** - TypeScript types co-located with features  
✅ **Best Practices** - Follows industry standards for enterprise applications  

## 🔄 Migration Notes

- All imports now use `@/` path alias (no change needed)
- Feature components moved to `features/[name]/components/`
- Shared components remain in `components/`
- Configuration centralized in `config/`
- Tests organized by type (unit, integration, e2e)

## 🆘 Need Help?

- Check [ENTERPRISE_STRUCTURE.md](./ENTERPRISE_STRUCTURE.md) for detailed architecture
- Look at existing features for examples
- Run `npm run validate` to check for issues
- Check the test examples in `__tests__/` folders

---

**Your project now follows enterprise-grade architecture! 🎉**
