# 📚 Enterprise Documentation Index

## 🎯 Start Here

### New to the project?
1. **[APP_FOLDER_EXPLAINED.md](./APP_FOLDER_EXPLAINED.md)** ⭐ **READ THIS FIRST!**
   - Explains why `app/` folder exists
   - Clarifies the three-layer architecture
   - Shows correct patterns vs antipatterns

2. **[ARCHITECTURE_VISUAL_GUIDE.md](./ARCHITECTURE_VISUAL_GUIDE.md)** ⭐ **VISUAL GUIDE**
   - Visual diagrams of the architecture
   - Request flow examples
   - Decision tree for where to put code

3. **[QUICK_START_ENTERPRISE.md](./QUICK_START_ENTERPRISE.md)**
   - Quick reference guide
   - How to add features
   - Common patterns

### Deep Dive
4. **[ENTERPRISE_STRUCTURE.md](./ENTERPRISE_STRUCTURE.md)**
   - Complete architecture overview
   - All folders explained
   - Best practices

5. **[REFACTORING_COMPLETE_ENTERPRISE.md](./REFACTORING_COMPLETE_ENTERPRISE.md)**
   - What changed in the refactoring
   - Before/after comparison
   - Migration guide

6. **[ENTERPRISE_REFACTORING_CHECKLIST.md](./ENTERPRISE_REFACTORING_CHECKLIST.md)**
   - Detailed checklist of all changes
   - Files created
   - Configuration updates

## 🎓 By Topic

### Architecture & Structure
- [APP_FOLDER_EXPLAINED.md](./APP_FOLDER_EXPLAINED.md) - Understanding `app/` folder
- [ARCHITECTURE_VISUAL_GUIDE.md](./ARCHITECTURE_VISUAL_GUIDE.md) - Visual diagrams
- [ENTERPRISE_STRUCTURE.md](./ENTERPRISE_STRUCTURE.md) - Complete structure guide

### Getting Started
- [QUICK_START_ENTERPRISE.md](./QUICK_START_ENTERPRISE.md) - Quick start
- [README.md](./README.md) - Original project README

### Implementation
- [KEYCLOAK_AUTH_IMPLEMENTATION.md](./KEYCLOAK_AUTH_IMPLEMENTATION.md) - Auth details
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) - Frontend specifics
- [TECH_STACK.md](./TECH_STACK.md) - Technologies used

### Testing
- [\_\_tests\_\_/unit/README.md](./__tests__/unit/README.md) - Unit testing
- [\_\_tests\_\_/integration/README.md](./__tests__/integration/README.md) - Integration testing
- [e2e/README.md](./e2e/README.md) - E2E testing

## 🔑 Key Concepts

### The Three-Layer Architecture

```
app/          → ROUTING (thin - just routes)
features/     → BUSINESS LOGIC (thick - where code lives)
components/   → UI (shared interface elements)
```

### Golden Rule
> **`app/` folder contains ONLY routes. All business logic goes in `features/`.**

### Example
```typescript
// ✅ CORRECT: app/products/page.tsx
import { ProductsPageContent } from '@/features/products';
export default function ProductsPage() {
  return <ProductsPageContent />;
}

// ❌ WRONG: Don't put logic in app/ pages
export default function ProductsPage() {
  const [products, setProducts] = useState([]);  // ❌ No!
  // ... business logic here ❌ No!
}
```

## 📁 Quick Reference

### Where does my code go?

| What you're adding | Where it goes | Example |
|-------------------|---------------|---------|
| New page/route | `app/` | `app/products/page.tsx` |
| Business logic | `features/` | `features/products/` |
| API calls | `features/[name]/api/` | `features/products/api/` |
| Feature components | `features/[name]/components/` | `features/auth/components/LoginForm.tsx` |
| Shared UI components | `components/ui/` | `components/ui/button.tsx` |
| Layouts | `components/layout/` | `components/layout/header.tsx` |
| Hooks | `features/[name]/hooks/` | `features/products/hooks/use-products.ts` |
| Types | `features/[name]/types/` | `features/products/types/product.types.ts` |
| Validation | `features/[name]/schemas/` | `features/auth/schemas/login.schema.ts` |
| Utilities | `lib/utils/` | `lib/utils/format.ts` |
| Configuration | `config/` | `config/app.config.ts` |
| Tests | `__tests__/unit/` or `e2e/` | `__tests__/unit/components/button.test.tsx` |

## 🚀 Common Tasks

### Adding a New Feature
See [QUICK_START_ENTERPRISE.md](./QUICK_START_ENTERPRISE.md#-adding-a-new-feature)

### Adding a New Page
```bash
# 1. Create route in app/
# 2. Create feature component in features/
# 3. Import feature component in route
```

### Adding a Shared Component
```bash
# Add to components/ui/ if it's a base UI component
# Add to components/layout/ if it's a layout component
# Add to components/common/ if it's a utility component
```

## 🧪 Testing

- **Unit Tests:** `npm run test`
- **E2E Tests:** `npm run test:e2e`
- **Coverage:** `npm run test:coverage`

See testing documentation in `__tests__/` folders.

## 🔗 External Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Feature-Driven Architecture](https://en.wikipedia.org/wiki/Domain-driven_design)
- [React Best Practices](https://react.dev/learn/thinking-in-react)

## ❓ FAQ

**Q: Why is the `app/` folder at the root?**  
A: It's required by Next.js App Router. We removed the `src/` folder to follow enterprise structure.

**Q: Why do we have both `app/` and `features/`?**  
A: `app/` defines routes (navigation), `features/` contains business logic. This separation is an enterprise best practice.

**Q: Where do I put my component?**  
A: If it's specific to one feature → `features/[name]/components/`  
If it's shared → `components/`

**Q: Can I put business logic in `app/` pages?**  
A: ❌ No! Always delegate to `features/`. Keep `app/` thin.

## 📞 Need Help?

1. Read [APP_FOLDER_EXPLAINED.md](./APP_FOLDER_EXPLAINED.md) first
2. Check [ARCHITECTURE_VISUAL_GUIDE.md](./ARCHITECTURE_VISUAL_GUIDE.md) for diagrams
3. Look at existing features for examples
4. Run `npm run validate` to check for issues

---

**Welcome to enterprise-grade architecture!** 🎉
