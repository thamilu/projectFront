# Enterprise Authentication System Documentation

## Overview

This document describes the enterprise-grade authentication system implemented for the e-commerce platform. The system uses **Keycloak** as the identity provider with **OAuth2 + PKCE** flow for maximum security.

## Architecture

### High-Level Flow

```
┌────────────┐         ┌──────────────┐         ┌──────────────┐
│            │         │              │         │              │
│  Browser   │────────▶│  Next.js     │────────▶│  Keycloak    │
│            │         │  Frontend    │         │  (IdP)       │
└────────────┘         └──────────────┘         └──────────────┘
      │                       │                        │
      │  1. Initiate Login   │                        │
      ├──────────────────────▶                        │
      │                       │  2. Generate PKCE     │
      │                       │     Challenge         │
      │                       │                        │
      │  3. Redirect to Auth │                        │
      ├───────────────────────────────────────────────▶
      │                       │                        │
      │  4. User Authenticates                        │
      │◀──────────────────────────────────────────────┤
      │                       │                        │
      │  5. Callback with    │                        │
      │     Authorization    │                        │
      │     Code             │                        │
      ├──────────────────────▶                        │
      │                       │  6. Exchange Code     │
      │                       │     with PKCE         │
      │                       │     Verifier          │
      │                       ├───────────────────────▶
      │                       │                        │
      │                       │  7. Return Tokens     │
      │                       │◀───────────────────────┤
      │                       │  8. Create Session    │
      │                       │     Cookie            │
      │  9. Redirect to App  │                        │
      │◀──────────────────────┤                        │
```

### Security Layers

1. **PKCE (Proof Key for Code Exchange)** - Prevents authorization code interception
2. **State Parameter** - CSRF protection
3. **Nonce** - Replay attack prevention
4. **Encrypted Session Cookie** - JWT with HS256 signature
5. **HttpOnly Cookies** - XSS protection
6. **SameSite=Lax** - CSRF protection
7. **Secure Flag** - HTTPS only in production
8. **Security Headers** - Multiple defense layers

## Directory Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── keycloak-config.ts      # Configuration management
│   │   ├── pkce.ts                 # PKCE implementation
│   │   └── session.ts              # Session management
│   └── observability/
│       └── logger.ts               # Structured logging
│
├── domain/
│   └── auth/
│       ├── types.ts                # Type definitions
│       └── schemas.ts              # Zod validation schemas
│
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── me/
│   │       │   └── route.ts        # Current user endpoint
│   │       └── keycloak/
│   │           ├── route.ts        # Auth initiation
│   │           ├── callback/
│   │           │   └── route.ts    # OAuth2 callback handler
│   │           ├── refresh/
│   │           │   └── route.ts    # Token refresh
│   │           └── logout/
│   │               └── route.ts    # Logout handler
│   ├── auth/
│   │   └── error/
│   │       └── page.tsx            # Error display page
│   └── 403/
│       └── page.tsx                # Forbidden page
│
├── hooks/
│   └── use-auth.ts                 # Client-side auth hooks
│
└── src/proxy.ts                    # Auth & RBAC proxy (replaces middleware.ts)
```

## Environment Variables

### Required Variables

```bash
# Keycloak Configuration
KEYCLOAK_AUTH_SERVER_URL=https://keycloak.example.com
KEYCLOAK_REALM=ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-frontend
KEYCLOAK_CLIENT_SECRET=              # Optional for public clients

# Session Encryption
SESSION_SECRET=<generated-secret>     # Generate with: openssl rand -base64 32

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=info                        # debug | info | warn | error
SERVICE_NAME=ecommerce-frontend
APP_VERSION=1.0.0

# Backend API
BACKEND_API_URL=http://localhost:8082

# Security
CONTENT_SECURITY_POLICY="default-src 'self'"
```

## API Endpoints

### Authentication Flow

#### 1. Initiate Login

```
GET /api/auth/keycloak
```

Query Parameters:

- `redirectTo` (optional): URL to redirect after successful login
- `prompt` (optional): `login` | `consent` | `select_account`
- `login_hint` (optional): Email or username hint

**Response:** Redirects to Keycloak authorization endpoint

#### 2. OAuth2 Callback

```
GET /api/auth/keycloak/callback
```

Query Parameters:

- `code`: Authorization code from Keycloak
- `state`: CSRF protection token
- `error` (if failed): Error code
- `error_description` (if failed): Error description

**Response:** Redirects to application with session cookie set

#### 3. Token Refresh

```
POST /api/auth/keycloak/refresh
```

**Response:**

```json
{
  "success": true,
  "expiresIn": 3600
}
```

#### 4. Logout

```
POST /api/auth/keycloak/logout
GET /api/auth/keycloak/logout
```

**POST Request Body:**

```json
{
  "sso": true,
  "redirectTo": "/"
}
```

**Response:**

```json
{
  "success": true,
  "logoutUrl": "https://keycloak.example.com/...",
  "message": "Redirect to logout URL to complete SSO logout"
}
```

#### 5. Get Current User

```
GET /api/auth/me
```

Query Parameters:

- `full` (optional): If `true`, fetches complete profile from backend API

**Response:**

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["customer"]
}
```

## Client-Side Usage

### useAuth Hook

```tsx
import { useAuth } from '@/hooks/use-auth';

function ProfilePage() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <p>Please log in to continue</p>
        <button onClick={() => login('/dashboard')}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Roles: {user.roles.join(', ')}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### useRequireAuth Hook

```tsx
import { useRequireAuth } from '@/hooks/use-auth';

function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <Spinner />;
  }

  // User is guaranteed to be authenticated here
  return <div>Dashboard for {user.name}</div>;
}
```

### useRequireRole Hook

```tsx
import { useRequireRole } from '@/hooks/use-auth';

function AdminPanel() {
  const { user, isLoading } = useRequireRole(['admin']);

  if (isLoading) {
    return <Spinner />;
  }

  // User is guaranteed to have admin role here
  return <div>Admin Panel</div>;
}
```

### useHasRole Hook

```tsx
import { useHasRole } from '@/hooks/use-auth';

function ProductCard({ product }) {
  const canEdit = useHasRole(['admin', 'seller'], false);

  return (
    <div>
      <h3>{product.name}</h3>
      {canEdit && <button>Edit Product</button>}
    </div>
  );
}
```

## Middleware & Route Protection

### Automatic Protection

The middleware automatically protects routes based on configuration:

```typescript
// proxy.ts (see src/proxy.ts)

const ROUTES = {
  public: ['/', '/products', '/about'],
  protected: ['/dashboard', '/orders'],
  admin: ['/admin'],
  seller: ['/seller'],
};
```

### Custom Protection

For custom protection logic, check session in Server Components:

```tsx
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getSession();

  if (!session) {
    redirect('/api/auth/keycloak');
  }

  return <div>Protected Content</div>;
}
```

## Role-Based Access Control (RBAC)

### Available Roles

- `CUSTOMER` - Regular shoppers
- `SELLER` - All seller types (individual, business, farmer, wholesaler, retailer)
- `DELIVERY_AGENT` - Delivery personnel
- `ADMIN` - System administrators

**Note:** Seller types (INDIVIDUAL, BUSINESS, FARMER, WHOLESALER, RETAILER) are stored in the database, not as separate Keycloak roles. See [ARCHITECTURE_UPDATE.md](../../ARCHITECTURE_UPDATE.md) for details.

### Checking Roles Server-Side

```typescript
import { hasRole, hasAnyRole, hasAllRoles } from '@/lib/auth/session';

// Check single role
const isAdmin = await hasRole('ADMIN');

// Check any of multiple roles
const canManage = await hasAnyRole(['admin', 'manager']);

// Check all roles required
const hasAllPermissions = await hasAllRoles(['admin', 'manager']);
```

## Security Best Practices

### PKCE Implementation

✅ **Implemented:**

- 32-byte cryptographic random code_verifier
- SHA-256 code_challenge
- Base64URL encoding
- One-time use (cleared after exchange)

### State Parameter (CSRF Protection)

✅ **Implemented:**

- 32-byte random state token
- Encrypted storage in httpOnly cookie
- Validation on callback
- Security event logging for mismatches

### Nonce (Replay Prevention)

✅ **Implemented:**

- 32-byte random nonce
- Stored with PKCE state
- Validated in ID token
- Prevents token replay attacks

### Session Security

✅ **Implemented:**

- JWT encryption with HS256
- HttpOnly cookies (XSS protection)
- SameSite=Lax (CSRF protection)
- Secure flag in production
- Automatic expiration
- Server-side secret rotation support

### Security Headers

✅ **Implemented:**

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Request-ID` for tracing
- Optional CSP header

## Error Handling

### Error Codes

- `configuration_error` - Keycloak not configured
- `invalid_request` - Malformed request
- `session_expired` - PKCE state expired
- `state_mismatch` - CSRF attack detected
- `nonce_mismatch` - Replay attack detected
- `callback_failed` - Token exchange failed
- `token_refresh_failed` - Refresh failed
- `logout_failed` - Logout failed

### User-Friendly Error Pages

All errors redirect to `/auth/error` with appropriate error codes and descriptions.

## Logging & Observability

### Structured Logging

All authentication events are logged in JSON format:

```json
{
  "timestamp": "2025-12-21T10:30:00.000Z",
  "level": "info",
  "message": "Authentication successful",
  "context": {
    "requestId": "req-123",
    "userId": "user-456",
    "email": "user@example.com",
    "roles": ["customer"]
  },
  "service": "ecommerce-frontend",
  "environment": "production"
}
```

### Request Tracing

Every request gets a unique `X-Request-ID` header for distributed tracing.

### Security Events

Security-related events are logged with `securityEvent: true` for alerting:

- Failed authentication attempts
- CSRF/replay attack detection
- Authorization failures
- Token refresh failures

## Performance Considerations

### Time Complexity

- Session validation: **O(1)** - JWT verification
- Route matching: **O(1)** - Direct lookups
- Role checking: **O(n)** - Where n = number of roles (typically < 10)

### Space Complexity

- Session storage: **O(1)** - Fixed cookie size (~1-2KB)
- PKCE state: **O(1)** - 5-minute TTL

### Optimizations

✅ Configuration singleton - Loaded once
✅ Memoized endpoint URLs
✅ Stateless sessions (no server-side storage)
✅ Edge runtime compatible (with Web Crypto API)

## Testing

### Manual Testing Checklist

- [ ] Login flow completes successfully
- [ ] User redirected to original destination after login
- [ ] Session persists across page refreshes
- [ ] Token refresh works when nearing expiration
- [ ] Logout clears session completely
- [ ] SSO logout redirects to Keycloak
- [ ] Protected routes redirect to login
- [ ] Role-restricted routes show 403
- [ ] Error pages display correctly
- [ ] Security headers present in responses

### Integration Testing

```typescript
// Example test
describe('Authentication Flow', () => {
  it('should complete login flow', async () => {
    // 1. Visit protected page
    const response = await fetch('/dashboard');
    expect(response.status).toBe(302);

    // 2. Follow redirect to /api/auth/keycloak
    // 3. Keycloak authentication
    // 4. Callback with code
    // 5. Verify session cookie set
    // 6. Verify redirect to /dashboard
  });
});
```

## Troubleshooting

### Common Issues

**Issue:** "SESSION_SECRET must be at least 32 characters"
**Solution:** Generate a secure secret: `openssl rand -base64 32`

**Issue:** "Missing required Keycloak configuration"
**Solution:** Ensure all required env vars are set in `.env.local`

**Issue:** "Token exchange failed"
**Solution:**

- Verify Keycloak client configuration
- Check redirect URI matches exactly
- Ensure client secret is correct (if confidential client)

**Issue:** "State mismatch"
**Solution:**

- Check cookie settings
- Verify SESSION_SECRET is consistent across instances
- Ensure cookies not blocked by browser

**Issue:** "PKCE state not found or expired"
**Solution:**

- Reduce time between auth initiation and callback
- Check cookie domain/path settings
- Verify httpOnly cookies not being cleared

## Migration from Old Implementation

### Breaking Changes

1. **Cookie names changed:**
   - ~~`accessToken`~~ → `auth_session` (encrypted)
   - ~~`refreshToken`~~ → Stored in `auth_session`
   - ~~`pkce_verifier`~~ → `pkce_state` (encrypted)

2. **Environment variables changed:**
   - ~~`KEYCLOAK_URL`~~ → `KEYCLOAK_AUTH_SERVER_URL`
   - Added `SESSION_SECRET` (required)

3. **API endpoints changed:**
   - ~~`/api/auth/keycloak/start`~~ → `/api/auth/keycloak`

### Migration Steps

1. Update environment variables in `.env.local`
2. Generate and set `SESSION_SECRET`
3. Update any direct cookie access code
4. Test authentication flow thoroughly
5. Monitor logs for any errors

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables set in production
- [ ] SESSION_SECRET is cryptographically random and secure
- [ ] Keycloak client configured with correct redirect URIs
- [ ] HTTPS enabled (required for Secure cookies)
- [ ] Security headers configured
- [ ] Logging integrated with monitoring system
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Rate limiting configured for auth endpoints

### Monitoring

Monitor these metrics:

- Authentication success/failure rates
- Token refresh success rates
- Average authentication duration
- Error rates by error code
- Security event frequencies

## Support & Maintenance

### Updating Dependencies

Keep these packages up to date:

- `jose` - JWT library
- `zod` - Validation library
- `next` - Next.js framework

### Security Updates

Review and apply security patches for:

- Keycloak server
- Node.js runtime
- npm dependencies

### Backup & Recovery

Session data is stateless (cookie-based), so no backup needed.

Configuration is in environment variables - back up your `.env` files securely.

---

**Version:** 1.0.0
**Last Updated:** December 2025
**Maintainer:** Platform Engineering Team
