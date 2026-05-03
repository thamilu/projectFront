# Root Layout - Quick Reference Guide

## 🚀 Quick Start

### Adding a New Page

```typescript
// app/my-page/page.tsx
export default function MyPage() {
  return (
    <main id="main-content" className="container py-8">
      <h1>My Page</h1>
      {/* Content */}
    </main>
  );
}
```

**Required:** Always include `id="main-content"` on the main element for skip-to-content functionality.

---

## 🎯 Common Use Cases

### 1. Protected Page (Auth Required)

```typescript
import { withAuth } from '@/components/providers/auth-provider';

function DashboardPage() {
  return <div>Dashboard Content</div>;
}

export default withAuth(DashboardPage);
```

### 2. Role-Based Protection

```typescript
import { withAuth } from '@/components/providers/auth-provider';

function AdminPage() {
  return <div>Admin Panel</div>;
}

export default withAuth(AdminPage, {
  roles: ['admin'],
  fallback: <div>Loading...</div>,
});
```

### 3. Check Role in Component

```typescript
'use client';

import { useAuth } from '@/components/providers/auth-provider';

function MyComponent() {
  const { user, hasRole, hasAnyRole } = useAuth();

  if (hasRole('admin')) {
    return <AdminFeatures />;
  }

  if (hasAnyRole(['seller', 'farmer'])) {
    return <SellerFeatures />;
  }

  return <CustomerFeatures />;
}
```

### 4. Show Toast Notification

```typescript
'use client';

import { toast } from 'sonner';

function MyForm() {
  const handleSubmit = async () => {
    try {
      await submitData();
      toast.success('Data saved successfully!');
    } catch (error) {
      toast.error('Failed to save data', {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(),
        },
      });
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 5. Announce to Screen Readers

```typescript
'use client';

import { announce } from '@/components/common/screen-reader-announcer';

function ProductList() {
  const applyFilter = (filter: string) => {
    // Apply filter logic...
    announce(`Filter applied: ${filter}`);
  };

  return <FilterButtons onApply={applyFilter} />;
}
```

### 6. Track Analytics Event

```typescript
'use client';

import { trackEvent } from '@/components/providers/analytics-provider';

function CheckoutButton() {
  const handleCheckout = () => {
    trackEvent('checkout_started', {
      cart_value: cartTotal,
      items_count: items.length,
    });
    router.push('/checkout');
  };

  return <button onClick={handleCheckout}>Checkout</button>;
}
```

### 7. Error Boundary for Feature

```typescript
import { ErrorBoundary } from '@/components/common/error-boundary';

function MyPage() {
  return (
    <ErrorBoundary fallback={<div>Failed to load feature</div>}>
      <RiskyFeature />
    </ErrorBoundary>
  );
}
```

---

## 📦 Available Hooks

### useAuth()

```typescript
const {
  user,           // Current user or null
  status,         // 'loading' | 'authenticated' | 'unauthenticated'
  login,          // Redirect to login
  logout,         // Logout user
  refresh,        // Refresh session
  hasRole,        // Check single role
  hasAnyRole,     // Check multiple roles (OR)
  hasAllRoles,    // Check multiple roles (AND)
  canAccess,      // Check access with roles
} = useAuth();
```

### useTheme() (from next-themes)

```typescript
import { useTheme } from 'next-themes';

const { theme, setTheme, systemTheme } = useTheme();

// Switch theme
setTheme('dark');    // 'light', 'dark', or 'system'
```

---

## 🎨 Styling Guidelines

### Tailwind Classes

```typescript
// Background/Foreground (theme-aware)
className="bg-background text-foreground"

// Card
className="bg-card text-card-foreground border border-border"

// Primary action
className="bg-primary text-primary-foreground"

// Muted text
className="text-muted-foreground"

// Destructive (errors, delete)
className="bg-destructive text-destructive-foreground"
```

### Layout Patterns

```typescript
// Full-height centered
className="min-h-screen flex items-center justify-center"

// Container with padding
className="container mx-auto px-4 py-8"

// Card layout
className="rounded-lg border bg-card p-6 shadow-sm"
```

---

## 🔧 Configuration

### Site Config

Edit: [src/lib/config/site.ts](src/lib/config/site.ts)

```typescript
export const siteConfig = {
  name: 'Your App Name',
  description: 'Your app description',
  url: process.env.NEXT_PUBLIC_APP_URL,
  // ...
};
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_API_URL=http://localhost:8082

# Optional
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-token
```

---

## 🐛 Common Issues

### Issue: Theme flashes on load
**Solution:** Already fixed with `suppressHydrationWarning`

### Issue: Skip-to-content doesn't work
**Solution:** Add `id="main-content"` to main element

### Issue: Toast not showing
**Solution:** Ensure component is client component (`'use client'`)

### Issue: Auth state not updating
**Solution:** Auth provider handles this automatically, use `refresh()` if needed

### Issue: Analytics not tracking
**Solution:** Set `NEXT_PUBLIC_GA_ID` environment variable

---

## 📁 File Structure

```
src/
├── app/
│   ├── layout.tsx              # ← Root layout (refactored)
│   ├── providers.tsx           # ← Provider hierarchy
│   ├── global-error.tsx        # ← Global error handler
│   ├── manifest.ts             # ← PWA manifest
│   └── globals.css             # ← Global styles
├── components/
│   ├── providers/
│   │   ├── theme-provider.tsx      # ← Theme switching
│   │   ├── auth-provider.tsx       # ← Authentication
│   │   ├── toast-provider.tsx      # ← Notifications
│   │   └── analytics-provider.tsx  # ← Tracking
│   ├── layout/
│   │   └── skip-to-content.tsx     # ← Accessibility
│   └── common/
│       ├── error-boundary.tsx           # ← Error handling
│       ├── screen-reader-announcer.tsx  # ← A11y announcements
│       ├── cookie-consent.tsx           # ← GDPR compliance
│       └── network-status.tsx           # ← Connectivity
└── lib/
    ├── config/
    │   └── site.ts             # ← Site configuration
    └── fonts/
        └── index.ts            # ← Font configuration
```

---

## ✅ Checklist for New Pages

- [ ] Add `id="main-content"` to main element
- [ ] Use semantic HTML (`<main>`, `<article>`, `<section>`)
- [ ] Add proper heading hierarchy (h1 → h2 → h3)
- [ ] Test keyboard navigation
- [ ] Add loading states for async operations
- [ ] Handle errors gracefully
- [ ] Add toast notifications for user actions
- [ ] Track important user interactions
- [ ] Test with theme switcher (light/dark)
- [ ] Verify responsiveness (mobile/tablet/desktop)

---

## 🔗 Useful Links

- [Full Implementation Guide](./ROOT_LAYOUT_REFACTORING.md)
- [Authentication Docs](./AUTHENTICATION.md)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## 💡 Tips

1. **Always use the auth provider** instead of managing auth state manually
2. **Use toast for user feedback** - it's better UX than alerts
3. **Announce important changes** to screen reader users
4. **Wrap risky features in ErrorBoundary** for graceful degradation
5. **Use React Query** for all data fetching - it handles caching automatically
6. **Test with keyboard only** to ensure accessibility
7. **Check both light and dark themes** for all new features

---

## 📞 Getting Help

1. Check [Implementation Guide](./ROOT_LAYOUT_REFACTORING.md) for detailed explanations
2. Review existing components for patterns
3. Use TypeScript types for API guidance
4. Check browser console for errors and warnings
5. Use React DevTools to inspect component tree

---

**Last Updated:** December 21, 2025
