# 🎨 Enterprise Architecture Visual Guide

## 📊 The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    app/ (ROUTING LAYER)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ /login   │  │ /products│  │ /cart    │  Routes      │
│  │ page.tsx │  │ page.tsx │  │ page.tsx │  (THIN)      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        │ Delegates   │ Delegates   │ Delegates
        ↓             ↓             ↓
┌───────┼─────────────┼─────────────┼────────────────────┐
│       │  features/ (BUSINESS LOGIC LAYER)              │
│  ┌────▼────┐  ┌────▼─────┐  ┌────▼────┐               │
│  │  auth/  │  │ products/│  │  cart/  │  Logic        │
│  │ ├─api   │  │ ├─api    │  │ ├─api   │  (THICK)      │
│  │ ├─hooks │  │ ├─hooks  │  │ ├─hooks │               │
│  │ └─comp. │  │ └─comp.  │  │ └─comp. │               │
│  └─────────┘  └──────────┘  └─────────┘               │
└───────┬─────────────┬─────────────┬────────────────────┘
        │ Uses        │ Uses        │ Uses
        ↓             ↓             ↓
┌───────┼─────────────┼─────────────┼────────────────────┐
│       │  components/ (UI LAYER)                        │
│  ┌────▼──────────────▼─────────────▼──────┐           │
│  │ Shared UI Components (Button, Card...)  │           │
│  │  ├─ ui/          │  ├─ layout/          │           │
│  │  └─ common/      │  └─ home/            │           │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow Example: User Visits Product Page

```
1. User visits /products
   ↓
2. app/products/page.tsx (ROUTING)
   ↓
3. Renders <ProductsPageContent /> from features/products
   ↓
4. features/products/components/ProductsPageContent.tsx (LOGIC)
   ↓
5. Uses useProducts() hook
   ↓
6. features/products/hooks/use-products.ts
   ↓
7. Calls productApi.getAll()
   ↓
8. features/products/api/product-api.ts
   ↓
9. Returns data to component
   ↓
10. Renders <ProductCard /> from features/products/components
    ↓
11. Uses <Button />, <Card /> from components/ui
```

## 📁 Folder Responsibilities

### `app/` - Routing Layer (THIN)

**Purpose:** Define routes and page structure

**Contains:**
- ✅ Page components (`page.tsx`)
- ✅ Layouts (`layout.tsx`)
- ✅ Route groups (`(admin)`, `(shop)`)
- ✅ Loading states (`loading.tsx`)
- ✅ Error boundaries (`error.tsx`)
- ✅ Metadata configuration

**Does NOT Contain:**
- ❌ Business logic
- ❌ Data fetching
- ❌ API calls
- ❌ State management
- ❌ Form validation

**Example:**
```typescript
// app/products/page.tsx
import { ProductsPageContent } from '@/features/products';

export const metadata = {
  title: 'Products - EcomApp'
};

export default function ProductsPage() {
  return <ProductsPageContent />;
}
```

### `features/` - Business Logic Layer (THICK)

**Purpose:** Domain-specific business logic and functionality

**Contains:**
- ✅ API calls (`api/`)
- ✅ Custom hooks (`hooks/`)
- ✅ Feature components (`components/`)
- ✅ Type definitions (`types/`)
- ✅ Validation schemas (`schemas/`)
- ✅ Business utilities (`utils/`)

**Example Structure:**
```
features/products/
├── api/
│   └── product-api.ts          # API calls
├── components/
│   ├── ProductsPageContent.tsx # Page content
│   ├── ProductCard.tsx         # Product card
│   └── ProductFilters.tsx      # Filters
├── hooks/
│   └── use-products.ts         # Data fetching
├── types/
│   └── product.types.ts        # TypeScript types
└── index.ts                     # Public exports
```

**Example:**
```typescript
// features/products/components/ProductsPageContent.tsx
import { useProducts } from '../hooks/use-products';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui';

export function ProductsPageContent() {
  const { products, isLoading } = useProducts();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Products</h1>
      <div className="grid grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### `components/` - UI Layer (SHARED)

**Purpose:** Reusable UI components used across multiple features

**Contains:**
- ✅ Base UI components (`ui/`)
- ✅ Layout components (`layout/`)
- ✅ Common utilities (`common/`)
- ✅ Home page components (`home/`)

**Example:**
```typescript
// components/ui/button.tsx
export function Button({ children, ...props }) {
  return (
    <button className="btn" {...props}>
      {children}
    </button>
  );
}
```

## 🎯 When to Put Code Where?

### Put in `app/`
- ✅ Route definitions
- ✅ Page metadata
- ✅ Layouts
- ✅ SEO configuration

### Put in `features/[domain]/`
- ✅ API calls for this domain
- ✅ Hooks for this domain
- ✅ Components specific to this domain
- ✅ Business logic for this domain
- ✅ Types for this domain

### Put in `components/`
- ✅ UI components used in multiple features
- ✅ Layout components (header, footer)
- ✅ Generic utilities (error boundaries)

### Put in `lib/`
- ✅ Cross-cutting utilities
- ✅ API client configuration
- ✅ Auth utilities
- ✅ Format helpers

### Put in `config/`
- ✅ Application configuration
- ✅ Environment variables
- ✅ Route definitions
- ✅ Feature flags

## 💡 Decision Tree

```
Does it define a URL route?
├─ YES → app/
└─ NO ↓

Is it specific to one business domain?
├─ YES → features/[domain]/
└─ NO ↓

Is it a UI component used in multiple places?
├─ YES → components/
└─ NO ↓

Is it a utility or helper function?
├─ YES → lib/
└─ Configuration? → config/
```

## 🔍 Real Examples from Your Project

### Example 1: Authentication

```
app/login/page.tsx               # Route (THIN)
   ↓ renders
features/auth/components/LoginForm.tsx    # Logic (THICK)
   ↓ uses
features/auth/hooks/useLogin.ts           # Hook
   ↓ calls
features/auth/api/auth-api.ts             # API
   ↓ uses
lib/axios.ts                              # HTTP client
```

### Example 2: Product Browsing

```
app/products/page.tsx            # Route (THIN)
   ↓ renders
features/products/components/ProductsPageContent.tsx  # Logic (THICK)
   ↓ uses
features/products/hooks/use-products.ts   # Hook
   ↓ renders
features/products/components/ProductCard.tsx  # Feature component
   ↓ uses
components/ui/button.tsx         # Shared UI
components/ui/card.tsx           # Shared UI
```

## ✅ Summary

| Folder | Layer | Thickness | Purpose |
|--------|-------|-----------|---------|
| `app/` | Routing | THIN | Routes only, delegates to features |
| `features/` | Business Logic | THICK | Domain logic, API calls, state |
| `components/` | UI | SHARED | Reusable components |
| `lib/` | Infrastructure | UTILITY | Cross-cutting concerns |
| `config/` | Configuration | SETTINGS | App configuration |

**Remember:** 
- `app/` is the **skeleton** (structure)
- `features/` is the **muscle** (functionality)
- `components/` is the **skin** (appearance)

This is the standard enterprise pattern used by major companies! ✅
