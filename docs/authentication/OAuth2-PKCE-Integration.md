# Keycloak OAuth2 PKCE Integration Guide

## 🎉 Implementation Complete

Your Next.js application now has **enterprise-grade Keycloak authentication** using `react-oauth2-code-pkce@^1.23.4` with **Authorization Code Flow + PKCE**.

---

## 📁 New Files Created

### Core Configuration
- **`src/lib/auth/authConfig.ts`** - Keycloak OAuth2 configuration (clientId, endpoints, scopes)
- **`src/hooks/useKeycloakAuth.ts`** - Type-safe authentication hook
- **`src/components/providers/keycloak-pkce-provider.tsx`** - PKCE Auth Provider wrapper

### UI Components
- **`src/components/auth/ModernAuthUI.tsx`** - Modern login/register UI with shadcn/ui
- **`src/components/auth/ProtectedRoute.tsx`** - HOC and component for route protection
- **`app/auth/callback/page.tsx`** - OAuth2 callback handler page
- **`app/auth/login/page.tsx`** - Modern login page (alternative to /login)

### Middleware
- **`middleware-enhanced.ts`** - Enhanced middleware with token-based protection

### Updated Files
- **`app/providers.tsx`** - Added KeycloakPKCEProvider to provider hierarchy

---

## 🔧 Environment Variables Required

Add these to your `.env.local`:

```env
# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=ecommerce
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ecommerce-frontend

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8082

# Optional: Enable/Disable Features
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_DIRECT_LOGIN=false
```

---

## 🚀 Usage Examples

### 1. Using the Auth Hook

```tsx
'use client';

import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';

export function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    register,
    hasRole,
    getAccessToken 
  } = useKeycloakAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <button onClick={() => login()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {user?.preferred_username}!</p>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}
```

### 2. Protected Page Component

```tsx
// app/dashboard/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';

function DashboardContent() {
  const { user } = useKeycloakAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>User: {user?.email}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['user', 'admin']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### 3. Using HOC for Protection

```tsx
import { withProtectedRoute } from '@/components/auth/ProtectedRoute';

function AdminPanel() {
  return <div>Admin Content</div>;
}

export default withProtectedRoute(AdminPanel, {
  requiredRoles: ['admin'],
  redirectTo: '/login',
});
```

### 4. Role-Based UI Rendering

```tsx
'use client';

import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';

export function Navigation() {
  const { user, hasRole, isAuthenticated } = useKeycloakAuth();

  return (
    <nav>
      <a href="/">Home</a>
      {isAuthenticated && <a href="/dashboard">Dashboard</a>}
      {hasRole('admin') && <a href="/admin">Admin Panel</a>}
      {hasRole('seller') && <a href="/seller">Seller Tools</a>}
    </nav>
  );
}
```

### 5. API Calls with Token

```tsx
import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';

export function useApi() {
  const { getAccessToken } = useKeycloakAuth();

  const fetchData = async () => {
    const token = getAccessToken();
    
    const response = await fetch('/api/data', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  };

  return { fetchData };
}
```

### 6. Using the Modern Auth UI

```tsx
// app/login/page.tsx
import { ModernAuthUI } from '@/components/auth/ModernAuthUI';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ModernAuthUI 
        redirectTo="/dashboard" 
        showRegister={true} 
      />
    </div>
  );
}
```

---

## 🔒 Route Protection

### Option 1: Enhanced Middleware (Recommended)

Replace your `middleware.ts` with `middleware-enhanced.ts`:

```bash
# Backup current middleware
mv middleware.ts middleware.backup.ts

# Use enhanced middleware
mv middleware-enhanced.ts middleware.ts
```

### Option 2: Component-Level Protection

Use `<ProtectedRoute>` or `withProtectedRoute()` HOC in individual pages.

---

## 📊 Token Structure

The decoded token (`tokenData`) contains:

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  email_verified: true,
  preferred_username: "johndoe",
  given_name: "John",
  family_name: "Doe",
  roles: ["user", "admin"],  // Extracted from realm_access
  realm_access: {
    roles: ["user", "admin"]
  },
  resource_access: { ... },
  exp: 1234567890,
  iat: 1234567890
}
```

---

## 🎨 UI Customization

The `ModernAuthUI` component uses shadcn/ui and Tailwind CSS:

```tsx
<ModernAuthUI 
  redirectTo="/dashboard"      // Where to go after login
  showRegister={true}          // Show register button
  className="custom-class"     // Add custom classes
/>
```

---

## 🔄 Flow Diagram

```
┌──────────────┐
│   User       │
│   Clicks     │
│   Login      │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  useKeycloakAuth()   │
│  calls login()       │
└──────┬───────────────┘
       │
       ▼
┌───────────────────────────────┐
│  Redirect to Keycloak         │
│  /auth?client_id=...&         │
│  response_type=code&          │
│  code_challenge=...           │
└──────┬────────────────────────┘
       │
       ▼ User authenticates
       │
┌──────────────────────────┐
│  Keycloak redirects to   │
│  /callback?code=...      │
└──────┬───────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  react-oauth2-code-pkce     │
│  exchanges code for tokens  │
│  using PKCE verifier        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Tokens stored securely │
│  User redirected to app │
└─────────────────────────┘
```

---

## ✅ Security Features

- ✅ **PKCE** - Prevents authorization code interception
- ✅ **No Implicit Flow** - Most secure OAuth2 flow
- ✅ **Token Auto-Refresh** - Seamless session extension
- ✅ **Secure Storage** - Library handles token storage safely
- ✅ **CSRF Protection** - State parameter validation
- ✅ **No Custom Token Logic** - Less attack surface

---

## 🧪 Testing

### Test Login Flow
1. Start your app: `npm run dev`
2. Navigate to `/auth/login`
3. Click "Sign In with Keycloak"
4. Authenticate with Keycloak
5. Verify redirect to `/dashboard`

### Test Registration
1. Go to `/auth/login`
2. Click "Create Account"
3. Complete Keycloak registration
4. Verify redirect back to app

### Test Protected Routes
1. Try accessing `/dashboard` without auth
2. Verify redirect to `/login`
3. Login and verify access granted

### Test Logout
1. Login to app
2. Click logout
3. Verify redirect to Keycloak logout
4. Verify session cleared

---

## 🐛 Troubleshooting

### "useKeycloakAuth must be used within AuthProvider"
- Ensure `KeycloakPKCEProvider` is in `app/providers.tsx`
- Check that it wraps your component tree

### Callback page shows error
- Verify `NEXT_PUBLIC_APP_URL/callback` is registered in Keycloak
- Check Keycloak client configuration has correct redirect URIs

### Tokens not refreshing
- Verify `offline_access` scope is requested
- Check Keycloak client has "Refresh Token" enabled

### Role checks failing
- Inspect `tokenData` structure: `console.log(tokenData)`
- Verify roles are in `realm_access.roles` array
- Check Keycloak role mapping configuration

---

## 🎯 Next Steps

1. **Configure Keycloak** - Set up realm, client, and roles
2. **Test Authentication** - Run through login/logout flows
3. **Protect Routes** - Add protection to sensitive pages
4. **Customize UI** - Modify `ModernAuthUI` to match your brand
5. **Add Role Logic** - Implement role-based features

---

## 📚 Additional Resources

- [react-oauth2-code-pkce Documentation](https://github.com/soofstad/react-oauth2-pkce)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth 2.0 PKCE Spec](https://datatracker.ietf.org/doc/html/rfc7636)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Happy Authenticating! 🔐**
