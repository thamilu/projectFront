# 🚀 Quick Start Guide - Enterprise Authentication

## TL;DR

This e-commerce platform uses **Keycloak** for authentication with **OAuth2 + PKCE** flow. This guide gets you up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Keycloak server running (or access to one)
- Basic understanding of OAuth2

## Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

Required packages already in package.json:

- `jose` - JWT handling
- `zod` - Validation
- `next` - Framework

## Step 2: Configure Environment (2 minutes)

### Copy environment template

```bash
cp .env.example .env.local
```

### Set required variables

```bash
# .env.local

# Keycloak Configuration (REQUIRED)
KEYCLOAK_AUTH_SERVER_URL=https://keycloak.example.com
KEYCLOAK_REALM=ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-frontend
KEYCLOAK_CLIENT_SECRET=                    # Optional for public clients

# Session Secret (REQUIRED)
# Generate with: openssl rand -base64 32
SESSION_SECRET=your-super-secret-key-min-32-chars

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API
BACKEND_API_URL=http://localhost:8082
```

### Generate Session Secret

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output and paste into `SESSION_SECRET` in `.env.local`

## Step 3: Configure Keycloak (2 minutes)

### In Keycloak Admin Console:

1. **Create Client**
   - Client ID: `ecommerce-frontend`
   - Client Protocol: `openid-connect`
   - Access Type: `public` (or `confidential` if using client secret)

2. **Set Redirect URIs**

   ```
   http://localhost:3000/api/auth/keycloak/callback
   ```

3. **Set Post Logout Redirect URIs**

   ```
   http://localhost:3000/*
   ```

4. **Enable Flows**
   - ✅ Standard Flow (Authorization Code Flow)
   - ❌ Implicit Flow (not secure)
   - ❌ Direct Access Grants (not needed)

5. **Configure Scopes**
   - Add client scopes: `openid`, `profile`, `email`

6. **Create Roles** (Optional)
   - In Realm Roles or Client Roles, create:
     - `customer`
     - `admin`
     - `seller`
     - etc.

## Step 4: Start Development Server (30 seconds)

```bash
npm run dev
```

Server starts at `http://localhost:3000`

## Step 5: Test Authentication (1 minute)

### Test Login Flow

1. Navigate to a protected route:

   ```
   http://localhost:3000/dashboard
   ```

2. You should be redirected to Keycloak login

3. Enter credentials (or register new user)

4. After authentication, you're redirected back to `/dashboard`

5. Session cookie is set (check DevTools → Application → Cookies)

### Verify Session

1. Open browser DevTools → Application → Cookies
2. Look for `auth_session` cookie
3. Properties should be:
   - ✅ HttpOnly
   - ✅ SameSite: Lax
   - ✅ Secure (if HTTPS)

### Test API

```bash
# Get current user
curl http://localhost:3000/api/auth/me \
  -H "Cookie: auth_session=..." \
  -X GET
```

Response:

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["customer"]
}
```

## Common Use Cases

### Protecting a Page

```tsx
// app/dashboard/page.tsx
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/api/auth/keycloak');
  }

  return (
    <div>
      <h1>Welcome, {session.name}</h1>
    </div>
  );
}
```

### Using Client Hook

```tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

export default function ProfileButton() {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return <button onClick={() => login()}>Login</button>;
  }

  return (
    <div>
      <span>Hi, {user.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Role-Based UI

```tsx
'use client';

import { useHasRole } from '@/hooks/use-auth';

export function AdminButton() {
  const isAdmin = useHasRole('admin');

  if (!isAdmin) return null;

  return <button>Admin Panel</button>;
}
```

### Protected API Route

```typescript
// app/api/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ data: 'Admin data' });
}
```

## Troubleshooting

### Issue: "Missing required Keycloak configuration"

**Solution:** Check all environment variables in `.env.local`

```bash
# Verify variables are set
grep KEYCLOAK .env.local
```

### Issue: "SESSION_SECRET must be at least 32 characters"

**Solution:** Generate a proper secret

```bash
openssl rand -base64 32
```

### Issue: Redirects to Keycloak but gets error

**Possible causes:**

1. Redirect URI not configured in Keycloak
2. Wrong Keycloak URL
3. Client ID mismatch

**Check:**

```bash
# In browser console, check redirect URL
# Should match exactly: http://localhost:3000/api/auth/keycloak/callback
```

### Issue: "State mismatch" error

**Causes:**

- Cookies blocked by browser
- SESSION_SECRET changed between auth initiation and callback
- Taking too long (PKCE state expires in 5 minutes)

**Solution:**

- Check browser cookie settings
- Don't change SESSION_SECRET during testing
- Complete login within 5 minutes

### Issue: Infinite redirect loop

**Causes:**

- Middleware protecting auth endpoints
- Cookie not being set

**Check proxy matcher (formerly middleware):**

```typescript
export const config = {
  matcher: [
    // Should NOT match /api/auth/keycloak
    '/((?!api(?!/auth/keycloak)|_next/static|...).*)',
  ],
};
```

## Next Steps

1. **Read Full Documentation:** See [AUTHENTICATION.md](./AUTHENTICATION.md)
2. **Review Security:** See security section in docs
3. **Set Up Production:** Follow production deployment checklist
4. **Add Custom Roles:** Configure RBAC for your needs
5. **Implement Monitoring:** Set up logging and alerts

## Quick Reference

### Key Files

| File                                          | Purpose                                        |
| --------------------------------------------- | ---------------------------------------------- |
| `src/lib/auth/keycloak-config.ts`             | Configuration                                  |
| `src/lib/auth/session.ts`                     | Session management                             |
| `proxy.ts`                                    | Next.js 16 route protection and authentication |
| `src/hooks/use-auth.ts`                       | Client hooks                                   |
| `app/api/auth/keycloak/route.ts`          | Login initiation                               |
| `app/api/auth/keycloak/callback/route.ts` | OAuth callback                                 |

### Key Endpoints

| Endpoint                      | Method   | Purpose          |
| ----------------------------- | -------- | ---------------- |
| `/api/auth/keycloak`          | GET      | Start login flow |
| `/api/auth/keycloak/callback` | GET      | OAuth2 callback  |
| `/api/auth/keycloak/refresh`  | POST     | Refresh token    |
| `/api/auth/keycloak/logout`   | POST/GET | Logout           |
| `/api/auth/me`                | GET      | Current user     |

### Environment Variables

| Variable                   | Required | Description              |
| -------------------------- | -------- | ------------------------ |
| `KEYCLOAK_AUTH_SERVER_URL` | ✅       | Keycloak base URL        |
| `KEYCLOAK_REALM`           | ✅       | Realm name               |
| `KEYCLOAK_CLIENT_ID`       | ✅       | OAuth2 client ID         |
| `KEYCLOAK_CLIENT_SECRET`   | ❌       | For confidential clients |
| `SESSION_SECRET`           | ✅       | 32+ char secret          |
| `NEXT_PUBLIC_APP_URL`      | ✅       | Your app URL             |
| `BACKEND_API_URL`          | ✅       | Backend API URL          |

## Support

- **Documentation:** [AUTHENTICATION.md](./AUTHENTICATION.md)
- **Troubleshooting:** See docs troubleshooting section
- **Issues:** Check [GitHub Issues](../../issues)
- **Security Issues:** Report privately to security team

---

**Happy Coding! 🎉**

Questions? Check the full documentation or reach out to the platform team.
