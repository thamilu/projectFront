# NextAuth + Keycloak Implementation Guide

**Enterprise E-Commerce Frontend Authentication**

This guide provides complete step-by-step instructions for implementing and using NextAuth with Keycloak authentication in the enterprise e-commerce frontend application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Keycloak Configuration](#keycloak-configuration)
4. [Environment Setup](#environment-setup)
5. [Implementation Guide](#implementation-guide)
6. [Usage Examples](#usage-examples)
7. [Migration from PKCE](#migration-from-pkce)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Architecture Overview

### Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │         │   Next.js    │         │   Keycloak   │
│   (User)    │         │  (NextAuth)  │         │    Server    │
└──────┬──────┘         └──────┬───────┘         └──────┬───────┘
       │                       │                        │
       │  1. Click Login       │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │  2. Auth Request       │
       │                       │   (with PKCE)          │
       │                       ├───────────────────────>│
       │                       │                        │
       │  3. Redirect to Keycloak                       │
       │<──────────────────────┴────────────────────────┤
       │                                                 │
       │  4. User Login                                  │
       ├────────────────────────────────────────────────>│
       │                                                 │
       │  5. Auth Code (callback)                        │
       │<────────────────────────────────────────────────┤
       │                       │                        │
       │  6. Exchange Code     │                        │
       ├──────────────────────>│                        │
       │                       │  7. Token Request      │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │  8. Access Token +     │
       │                       │     Refresh Token      │
       │                       │<───────────────────────┤
       │                       │                        │
       │  9. Set Session       │                        │
       │     (HTTP-only cookie)│                        │
       │<──────────────────────┤                        │
       │                       │                        │
```

### Key Components

1. **NextAuth Route Handler** (`app/api/auth/[...nextauth]/route.ts`)
   - Manages OAuth2/OIDC flow
   - Handles token refresh
   - Extracts roles from JWT

2. **Custom Auth Hook** (`src/hooks/use-auth-nextauth.ts`)
   - Provides convenient auth API
   - Role-based access control
   - Session management

3. **Middleware** (`middleware.ts`)
   - Route protection
   - Role-based authorization
   - Automatic redirects

4. **Auth Guard Component** (`src/components/auth/auth-guard.tsx`)
   - Component-level protection
   - Loading states
   - Role checks

---

## Prerequisites

### Required Software

- **Node.js**: >= 24.12.0
- **npm**: >= 10.0.0
- **Keycloak**: >= 20.x (running instance)

### Required Knowledge

- Basic understanding of OAuth2/OIDC
- Next.js App Router fundamentals
- React hooks and context

---

## Keycloak Configuration

### Step 1: Create Realm

1. Log in to Keycloak Admin Console (`http://localhost:8080/admin`)
2. Click **"Create Realm"**
3. Enter realm name: `eshop`
4. Click **"Create"**

### Step 2: Create Client

1. Navigate to **Clients** → **"Create client"**
2. **General Settings**:
   ```
   Client type: OpenID Connect
   Client ID: eshop-web
   Name: E-Commerce Web Application
   Description: Frontend web client for e-commerce platform
   ```
3. Click **"Next"**

4. **Capability config**:
   ```
   ✅ Client authentication: ON (Confidential)
   ✅ Authorization: OFF
   ✅ Standard flow: ON (Authorization Code Flow)
   ✅ Direct access grants: OFF
   ✅ Implicit flow: OFF
   ```
5. Click **"Next"**

6. **Login settings**:
   ```
   Root URL: http://localhost:3000
   Home URL: http://localhost:3000
   Valid redirect URIs: 
     - http://localhost:3000/api/auth/callback/keycloak
     - http://localhost:3000/*
   Valid post logout redirect URIs:
     - http://localhost:3000
   Web origins: 
     - http://localhost:3000
   ```
7. Click **"Save"**

### Step 3: Configure PKCE

1. Go to **Clients** → `eshop-web` → **"Advanced"** tab
2. Find **"Proof Key for Code Exchange Code Challenge Method"**
3. Set to: **`S256`**
4. Click **"Save"**

### Step 4: Get Client Secret

1. Go to **Clients** → `eshop-web` → **"Credentials"** tab
2. Copy the **"Client secret"** value
3. Save this for your `.env.local` file

### Step 5: Create Roles

1. Navigate to **Realm roles** → **"Create role"**
2. Create the following roles:
   ```
   CUSTOMER     - Standard user role
   SELLER       - Vendor/merchant role
   ADMIN        - Administrative role
   ```

### Step 6: Create Test User

1. Navigate to **Users** → **"Add user"**
2. Fill in details:
   ```
   Username: testuser
   Email: test@example.com
   First name: Test
   Last name: User
   Email verified: ON
   ```
3. Click **"Create"**
4. Go to **"Credentials"** tab → **"Set password"**
   - Password: `TestPass123!`
   - Temporary: OFF
5. Go to **"Role mapping"** → **"Assign role"**
   - Assign `CUSTOMER` role

---

## Environment Setup

### Step 1: Create Environment File

Create `.env.local` in the project root:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars-long-please

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=eshop-web
KEYCLOAK_CLIENT_SECRET=<paste-from-keycloak-credentials-tab>
KEYCLOAK_ISSUER=http://localhost:8080/realms/eshop

# Public Variables (accessible in browser)
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/eshop
NEXT_PUBLIC_KEYCLOAK_REALM=eshop
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=eshop-web
NEXT_PUBLIC_API_BASE_URL=http://localhost:8082
```

### Step 2: Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
# PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Bash/Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as `NEXTAUTH_SECRET`.

### Step 3: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- `next-auth@^4.24.13`
- `@testing-library/react@^16.0.0`
- `@testing-library/jest-dom@^6.6.0`
- `@playwright/test@^1.48.0`
- `libphonenumber-js` (utility)

---

## Implementation Guide

### Step 1: Verify File Structure

Ensure these files exist (already created during migration):

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          ✅ NextAuth handler
│   └── providers.tsx                  ✅ Updated (no PKCE)
├── components/
│   ├── auth/
│   │   └── auth-guard.tsx            ✅ Auth guard component
│   └── NextAuthProvider.tsx          ✅ Session provider
├── hooks/
│   ├── use-auth-nextauth.ts          ✅ Primary auth hook
│   ├── use-authenticated-fetch.ts     ✅ API fetch wrapper
│   └── useKeycloakAuth.ts            ✅ Compatibility wrapper
├── lib/
│   └── auth/
│       └── authConfig.ts             ✅ Auth utilities
├── types/
│   └── next-auth.d.ts                ✅ Type definitions
middleware.ts                          ✅ Route protection
proxy.ts                               ✅ Route config
```

### Step 2: Update Root Layout (if needed)

Verify `app/layout.tsx` includes providers:

```tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Step 3: Create Sign-In Page

Create `app/auth/signin/page.tsx`:

```tsx
'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account using Keycloak
          </p>
        </div>

        <Button
          onClick={() => signIn('keycloak', { callbackUrl })}
          className="w-full"
          size="lg"
        >
          Sign in with Keycloak
        </Button>
      </div>
    </div>
  );
}
```

### Step 4: Create Error Page

Create `app/auth/error/page.tsx`:

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {error === 'RefreshAccessTokenError'
              ? 'Your session has expired. Please sign in again.'
              : 'An error occurred during authentication.'}
          </p>
        </div>

        <Link href="/auth/signin">
          <Button className="w-full">Try Again</Button>
        </Link>
      </div>
    </div>
  );
}
```

### Step 5: Create Unauthorized Page

Create `app/unauthorized/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth-nextauth';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            You don't have permission to access this resource.
          </p>
          {user && (
            <p className="mt-2 text-xs text-muted-foreground">
              Current roles: {user.roles.join(', ') || 'None'}
            </p>
          )}
        </div>

        <Link href="/">
          <Button className="w-full">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
```

---

## Usage Examples

### Basic Authentication Check

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth-nextauth';

export function MyComponent() {
  const { isAuthenticated, isLoading, user, login } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <button onClick={login}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

### Role-Based Access Control

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth-nextauth';

export function AdminPanel() {
  const { hasRole, hasAnyRole } = useAuth();

  // Check for specific role
  if (!hasRole('ADMIN')) {
    return <div>Access Denied</div>;
  }

  // Check for any of multiple roles
  if (!hasAnyRole(['ADMIN', 'SELLER'])) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Dashboard</div>;
}
```

### Protected Component with AuthGuard

```tsx
import { AuthGuard } from '@/components/auth/auth-guard';

export function ProtectedComponent() {
  return (
    <AuthGuard requiredRoles={['ADMIN']}>
      <div>This content is only visible to admins</div>
    </AuthGuard>
  );
}
```

### Authenticated API Calls

```tsx
'use client';

import { useAuthenticatedFetch } from '@/hooks/use-authenticated-fetch';
import { useQuery } from '@tanstack/react-query';

export function ProductList() {
  const { authFetch } = useAuthenticatedFetch();

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => authFetch<Product[]>('/api/v1/products'),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Manual API Call with Token

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth-nextauth';

export function ManualFetch() {
  const { accessToken } = useAuth();

  const fetchData = async () => {
    const response = await fetch('http://localhost:8082/api/v1/data', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### Logout with Redirect

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth-nextauth';

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Sign Out
    </button>
  );
}
```

### User Profile Display

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth-nextauth';

export function UserProfile() {
  const { user, roles } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-2">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <div>
        <strong>Roles:</strong>
        <ul>
          {roles.map(role => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## Migration from PKCE

### Backward Compatibility

The `useKeycloakAuth` hook has been updated to provide a compatibility layer. Existing components using it will continue to work:

```tsx
// Old PKCE code - still works!
import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';

export function LegacyComponent() {
  const { isAuthenticated, user, login, logout } = useKeycloakAuth();
  
  // Same API, now backed by NextAuth
  return <div>{user?.name}</div>;
}
```

### Migration Checklist

- [x] ✅ Package.json updated (removed `react-oauth2-code-pkce`)
- [x] ✅ Environment variables configured
- [x] ✅ Keycloak client configured with PKCE
- [x] ✅ NextAuth route handler created
- [x] ✅ Auth hooks and guards created
- [x] ✅ Middleware updated
- [x] ✅ Providers updated (removed `KeycloakPKCEProvider`)
- [ ] ⏳ Test login/logout flow
- [ ] ⏳ Test token refresh
- [ ] ⏳ Test role-based access
- [ ] ⏳ Update documentation

### Recommended Migration Path

1. **Phase 1: Compatibility Layer** (Current)
   - Keep `useKeycloakAuth` wrapper
   - Test all existing components
   - Fix any breaking changes

2. **Phase 2: Gradual Migration** (Optional)
   - Update new components to use `use-auth-nextauth`
   - Leave existing components using `useKeycloakAuth`
   - Both work simultaneously

3. **Phase 3: Complete Migration** (Future)
   - Replace all `useKeycloakAuth` with `use-auth-nextauth`
   - Remove compatibility wrapper
   - Cleaner codebase

---

## Testing

### Manual Testing Checklist

#### 1. Login Flow
```bash
# Start application
npm run dev

# Navigate to protected route
http://localhost:3000/account

# Expected: Redirect to Keycloak login
# Action: Enter credentials (testuser / TestPass123!)
# Expected: Redirect back to /account with session
```

#### 2. Session Persistence
```bash
# After login, check cookies
# Browser DevTools → Application → Cookies
# Expected: `next-auth.session-token` (HTTP-only, Secure in prod)

# Refresh page
# Expected: Stay logged in (no redirect)
```

#### 3. Token Refresh
```bash
# Wait 4 minutes (session refetch interval)
# Check Network tab for auth requests
# Expected: Automatic token refresh without logout
```

#### 4. Role-Based Access
```bash
# Navigate to admin route
http://localhost:3000/admin

# Expected (if CUSTOMER): Redirect to /unauthorized
# Expected (if ADMIN): Access granted
```

#### 5. Logout Flow
```bash
# Click logout button
# Expected: 
#   1. Next.js session cleared
#   2. Redirect to Keycloak logout
#   3. Keycloak session cleared
#   4. Redirect back to home
```

### Automated Testing

#### Unit Tests

Create `src/hooks/__tests__/use-auth-nextauth.test.tsx`:

```tsx
import { renderHook } from '@testing-library/react';
import { useAuth } from '../use-auth-nextauth';
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react');

describe('useAuth', () => {
  it('should return authenticated user', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'mock-token',
        roles: ['CUSTOMER'],
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('Test User');
    expect(result.current.hasRole('CUSTOMER')).toBe(true);
  });
});
```

#### E2E Tests

Create `tests/e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login and access protected route', async ({ page }) => {
    // Navigate to protected route
    await page.goto('http://localhost:3000/account');

    // Should redirect to Keycloak
    await expect(page).toHaveURL(/keycloak/);

    // Fill in credentials
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'TestPass123!');
    await page.click('#kc-login');

    // Should redirect back to app
    await expect(page).toHaveURL('http://localhost:3000/account');
    
    // Should see user info
    await expect(page.locator('text=testuser')).toBeVisible();
  });

  test('should deny access to admin without role', async ({ page }) => {
    // Login as CUSTOMER
    await loginAsCustomer(page);

    // Try to access admin route
    await page.goto('http://localhost:3000/admin');

    // Should redirect to unauthorized
    await expect(page).toHaveURL('http://localhost:3000/unauthorized');
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "NextAuth route not configured"

**Symptoms:**
```json
{
  "error": "NextAuth route not configured"
}
```

**Solution:**
- Verify `app/api/auth/[...nextauth]/route.ts` exists
- Check file exports `GET` and `POST` handlers
- Restart dev server

#### Issue 2: Redirect Loop

**Symptoms:**
- Infinite redirect between app and Keycloak
- Browser shows "Too many redirects"

**Solution:**
1. Check `NEXTAUTH_URL` matches your app URL exactly
2. Verify Keycloak redirect URIs include callback:
   ```
   http://localhost:3000/api/auth/callback/keycloak
   ```
3. Clear browser cookies and try again

#### Issue 3: Token Refresh Fails

**Symptoms:**
- Session expires after 5 minutes
- Logged out unexpectedly

**Solution:**
1. Check Keycloak token lifespan settings:
   - Realm Settings → Tokens → Access Token Lifespan
   - Should be > 5 minutes
2. Verify refresh token is being stored:
   ```typescript
   // In route.ts
   refreshToken: account.refresh_token // ✅ Should exist
   ```

#### Issue 4: Roles Not Available

**Symptoms:**
- `user.roles` is empty
- Role checks always fail

**Solution:**
1. Verify roles are assigned in Keycloak:
   - Users → [user] → Role mapping
2. Check role extraction logic:
   ```typescript
   // In route.ts extractRoles function
   return payload.realm_access?.roles ?? [];
   ```
3. Inspect token in jwt.io to verify roles exist

#### Issue 5: CORS Errors

**Symptoms:**
```
Access to fetch at 'http://localhost:8080' from origin 'http://localhost:3000' has been blocked by CORS
```

**Solution:**
1. Add to Keycloak client settings:
   ```
   Web Origins: http://localhost:3000
   ```
2. For API calls, use Next.js API routes as proxy
3. Configure backend CORS to allow frontend origin

### Debug Mode

Enable NextAuth debug mode in `.env.local`:

```env
NEXTAUTH_DEBUG=true
```

Check server console for detailed logs:
```
[next-auth][debug] JWT callback called
[next-auth][debug] Token: {...}
[next-auth][debug] Session callback called
```

### Check Session Data

Add debug component:

```tsx
'use client';

import { useSession } from 'next-auth/react';

export function SessionDebug() {
  const { data: session } = useSession();
  
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <pre className="bg-gray-100 p-4 text-xs">
      {JSON.stringify(session, null, 2)}
    </pre>
  );
}
```

---

## Security Best Practices

### 1. Environment Variables

- ✅ **DO**: Keep `.env.local` in `.gitignore`
- ✅ **DO**: Use different secrets for each environment
- ❌ **DON'T**: Commit secrets to version control
- ❌ **DON'T**: Use weak secrets (minimum 32 characters)

### 2. Cookie Security

Production configuration in `route.ts`:

```typescript
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true, // HTTPS only in production
    },
  },
},
```

### 3. Token Storage

- ✅ Tokens stored in HTTP-only cookies (not localStorage)
- ✅ Automatic token rotation
- ✅ Secure transmission (HTTPS in production)

### 4. PKCE Implementation

- ✅ Code Challenge Method: `S256`
- ✅ Prevents authorization code interception
- ✅ No client secret needed on frontend

### 5. Role Verification

Always verify roles on both frontend AND backend:

```typescript
// Frontend (UI only)
if (!hasRole('ADMIN')) {
  return <AccessDenied />;
}

// Backend (security enforcement)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.roles?.includes('ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... proceed
}
```

### 6. Production Checklist

- [ ] Enable HTTPS
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Update Keycloak redirect URIs
- [ ] Disable debug mode (`NEXTAUTH_DEBUG=false`)
- [ ] Set secure cookie flags
- [ ] Configure proper CORS
- [ ] Enable rate limiting
- [ ] Monitor failed auth attempts
- [ ] Regular dependency updates

---

## Additional Resources

### Official Documentation

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Keycloak Docs](https://www.keycloak.org/documentation)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [OAuth 2.0 + PKCE](https://oauth.net/2/pkce/)

### Internal Documentation

- `KEYCLOAK_AUTH_IMPLEMENTATION.md` - Original Keycloak setup
- `OAUTH2_PKCE_INTEGRATION.md` - PKCE integration details
- `README.md` - Project overview

### Support

For issues or questions:
1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review NextAuth.js documentation
3. Check Keycloak server logs
4. Enable debug mode for detailed logging

---

## Quick Reference

### Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand>
KEYCLOAK_CLIENT_ID=eshop-web
KEYCLOAK_CLIENT_SECRET=<from-keycloak>
KEYCLOAK_ISSUER=http://localhost:8080/realms/eshop
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/eshop
```

### Key Commands

```bash
# Install dependencies
npm install

# Generate secret
openssl rand -base64 32

# Start development
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Test
npm run test

# Build for production
npm run build
```

### Common Hooks

```tsx
// Primary auth hook
import { useAuth } from '@/hooks/use-auth-nextauth';

// Authenticated fetch
import { useAuthenticatedFetch } from '@/hooks/use-authenticated-fetch';

// Legacy compatibility
import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';

// NextAuth native
import { useSession, signIn, signOut } from 'next-auth/react';
```

---

## Changelog

### Version 2.0.0 (December 27, 2025)

- ✅ Migrated from `react-oauth2-code-pkce` to `next-auth`
- ✅ Implemented PKCE with S256 code challenge
- ✅ Added role-based access control
- ✅ Created auth guards and middleware
- ✅ Added comprehensive documentation
- ✅ Improved testing infrastructure
- ✅ Enhanced security with HTTP-only cookies

---

**Last Updated**: December 27, 2025  
**Author**: Enterprise E-Commerce Team  
**Version**: 2.0.0
