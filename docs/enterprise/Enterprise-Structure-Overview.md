# 🏗️ Enterprise E-Commerce - Project Structure

## ⚠️ Important: `app/` Folder Explained

**The `app/` folder IS part of the enterprise structure!** It's required by Next.js App Router.

**Key Principle:** 
- `app/` = **ROUTES ONLY** (navigation structure)
- `features/` = **BUSINESS LOGIC** (what the app does)
- `components/` = **SHARED UI** (reusable interface)

📖 Read [APP_FOLDER_EXPLAINED.md](./APP_FOLDER_EXPLAINED.md) for detailed explanation.

## 📁 Directory Structure

```
frontend/
├── app/                          # ✅ Next.js App Router (ROUTES ONLY - Required)
│   ├── (admin)/                  # Admin route group
│   ├── (shop)/                   # Shop route group
│   ├── auth/                     # Auth pages (delegate to features/auth)
│   ├── products/                 # Product pages (delegate to features/products)
│   ├── cart/                     # Cart page (delegate to features/cart)
│   ├── checkout/                 # Checkout flow (delegate to features/payments)
│   ├── orders/                   # Order pages (delegate to features/orders)
│   ├── seller/                   # Seller dashboard (delegate to features/seller)
│   ├── admin/                    # Admin panel pages
│   ├── delivery/                 # Delivery agent pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── providers.tsx             # Global providers
│
├── features/                     # 🎯 Domain-Driven Feature Modules
│   ├── auth/                     # Authentication & Authorization
│   │   ├── api/                  # Auth API calls
│   │   ├── components/           # Auth-specific components
│   │   ├── hooks/                # Auth hooks (useAuth, useLogin, etc.)
│   │   ├── schemas/              # Zod validation schemas
│   │   ├── types/                # Auth TypeScript types
│   │   ├── utils/                # Auth utilities
│   │   └── index.ts              # Feature exports
│   │
│   ├── products/                 # Product Management
│   │   ├── api/                  # Product API calls
│   │   ├── components/           # Product components
│   │   │   ├── product-card.tsx
│   │   │   ├── product-list.tsx
│   │   │   ├── product-filters.tsx
│   │   │   └── product-grid.tsx
│   │   ├── hooks/                # Product hooks
│   │   ├── schemas/              # Product validation
│   │   ├── types/                # Product types
│   │   └── index.ts
│   │
│   ├── cart/                     # Shopping Cart
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── orders/                   # Order Management
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── payments/                 # Payment Processing
│   │   ├── api/
│   │   ├── components/
│   │   │   └── payment-element.tsx
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── seller/                   # Seller Dashboard
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── AddProductForm.tsx
│   │   │   └── ImageUploader.tsx
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── users/                    # User Management
│       ├── api/
│       ├── hooks/
│       ├── schemas/
│       ├── types/
│       └── index.ts
│
├── components/                   # 🧩 Shared Components
│   ├── ui/                       # Base UI Components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── loading.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout Components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   │
│   ├── common/                   # Common Components
│   │   ├── error-boundary.tsx
│   │   ├── cookie-consent.tsx
│   │   └── network-status.tsx
│   │
│   ├── home/                     # Home Page Components
│   │   ├── Hero.tsx
│   │   ├── FeaturedSlider.tsx
│   │   └── CategorySection.tsx
│   │
│   └── index.ts                  # Component exports
│
├── lib/                          # 🛠️ Utilities & Services
│   ├── api/                      # API Layer
│   │   ├── client/               # API clients
│   │   └── api-client.ts         # Main API client
│   │
│   ├── auth/                     # Auth Utilities
│   │   ├── config.ts
│   │   ├── pkce.ts
│   │   ├── session.ts
│   │   └── tokens.ts
│   │
│   ├── utils/                    # General Utilities
│   │   ├── index.ts              # Main utils
│   │   ├── cn.ts                 # Class names
│   │   ├── date.ts               # Date utilities
│   │   └── format.ts             # Formatters
│   │
│   ├── validation/               # Validation
│   │   ├── rules/                # Validation rules
│   │   └── schemas/              # Validation schemas
│   │
│   ├── axios.ts                  # Axios configuration
│   ├── query-client.ts           # React Query config
│   └── index.ts                  # Lib exports
│
├── hooks/                        # 🎣 Global Custom Hooks
│   ├── useAuth.ts
│   ├── useUser.ts
│   ├── useLogin.ts
│   ├── useLogout.ts
│   └── use-debounce.ts
│
├── store/                        # 🏪 Global State Management (Zustand)
│   ├── auth-store.ts             # Auth state
│   ├── cart-store.ts             # Cart state
│   ├── ui-store.ts               # UI state
│   └── index.ts
│
├── types/                        # 📝 Global TypeScript Types
│   ├── index.ts                  # Main types
│   ├── api.types.ts              # API types
│   └── global.d.ts               # Global declarations
│
├── config/                       # ⚙️ Application Configuration
│   ├── app.config.ts             # App configuration
│   ├── env.config.ts             # Environment config
│   ├── routes.config.ts          # Routes config
│   └── index.ts
│
├── constants/                    # 📌 Global Constants
│   └── index.ts
│
├── __tests__/                    # 🧪 Tests
│   ├── unit/                     # Unit tests
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── integration/              # Integration tests
│   │   ├── api/
│   │   └── features/
│   └── setup.ts                  # Test setup
│
├── e2e/                          # 🎭 End-to-End Tests
│   ├── auth/
│   ├── checkout/
│   ├── products/
│   └── README.md
│
├── public/                       # 📦 Static Assets
│   ├── images/
│   ├── icons/
│   └── manifest.json
│
├── scripts/                      # 🔧 Utility Scripts
│   ├── validate-env.ts
│   └── generate-icons.js
│
└── docs/                         # 📚 Documentation
    └── ...

```

## 🎯 Key Architectural Principles

### 1. **Feature-First Organization**
- Each feature module is self-contained with its own components, hooks, API calls, types, and schemas
- Features are domain-driven (auth, products, cart, orders, etc.)
- Easy to understand, maintain, and scale

### 2. **Clear Separation of Concerns**
```
app/          → Routes & navigation (THIN - just routing)
features/     → Domain logic (THICK - business logic)
components/   → Reusable UI (shared interface elements)
lib/          → Utilities & services (infrastructure)
config/       → Configuration (app settings)
```

**Critical Pattern:**
- `app/` folder contains **ONLY** route definitions and page components
- All business logic, data fetching, and state management lives in `features/`
- `app/` pages **delegate** to feature components

**Example:**
```typescript
// app/products/page.tsx (THIN)
import { ProductsPageContent } from '@/features/products';

export default function ProductsPage() {
  return <ProductsPageContent />;  // Delegate to feature
}

// features/products/components/ProductsPageContent.tsx (THICK)
export function ProductsPageContent() {
  const { products, isLoading } = useProducts();  // Business logic here
  // ... rendering logic
}
```

### 3. **Centralized Exports**
Each module has an `index.ts` that exports its public API:
```typescript
// Import from feature
import { useAuth, LoginForm } from '@/features/auth';

// Import from components
import { Button, Card } from '@/components/ui';

// Import from config
import { routes, appConfig } from '@/config';
```

### 4. **Type Safety**
- TypeScript strict mode enabled
- Types co-located with features
- Zod schemas for runtime validation
- API response types match backend DTOs

### 5. **Scalability**
- Easy to add new features (just copy feature structure)
- Clear boundaries between modules
- Minimal coupling between features
- Testable architecture

## 📦 Feature Module Structure

Each feature follows this consistent pattern:

```
features/[feature-name]/
├── api/              # API calls for this feature
│   └── [feature]-api.ts
├── components/       # Feature-specific components
│   └── *.tsx
├── hooks/            # Feature-specific hooks
│   └── use-[feature].ts
├── schemas/          # Zod validation schemas
│   └── [feature].schema.ts
├── types/            # TypeScript types
│   └── [feature].types.ts
├── utils/            # Feature utilities
│   └── *.ts
└── index.ts          # Public API (exports)
```

## 🔄 Import Patterns

### ✅ Good Imports
```typescript
// Import from feature public API
import { useAuth, LoginForm } from '@/features/auth';

// Import from config
import { routes } from '@/config';

// Import shared components
import { Button } from '@/components/ui';

// Import utilities
import { cn } from '@/lib/utils';
```

### ❌ Avoid
```typescript
// Don't import from internal feature files
import { LoginForm } from '@/features/auth/components/LoginForm';

// Don't reach into other feature internals
import { mapRoles } from '@/features/auth/utils/role-mapper';
```

## 🧪 Testing Strategy

1. **Unit Tests** (`__tests__/unit/`)
   - Test individual components, hooks, utilities
   - Mock external dependencies
   - Fast, isolated tests

2. **Integration Tests** (`__tests__/integration/`)
   - Test feature modules working together
   - Test API integrations
   - Test state management

3. **E2E Tests** (`e2e/`)
   - Test complete user journeys
   - Use Playwright
   - Test critical paths

## 📊 State Management Strategy

1. **React Query** - Server state (API data)
2. **Zustand** - Client state (UI state, cart, auth)
3. **React Context** - Theme, global providers
4. **Local State** - Component-specific state

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 📝 Adding a New Feature

1. Create feature folder: `features/my-feature/`
2. Add subdirectories: `api/`, `components/`, `hooks/`, `types/`, `schemas/`
3. Create `index.ts` with exports
4. Add routes in `app/my-feature/`
5. Add configuration in `config/` if needed

## 🔗 Related Documentation

- [API Documentation](./KEYCLOAK_AUTH_IMPLEMENTATION.md)
- [Authentication Flow](./AUTHENTICATION.md)
- [Component Guidelines](./docs/UI-Design.md)
- [Testing Guide](./__tests__/README.md)

---

**This structure follows enterprise best practices for scalability, maintainability, and team collaboration.**
