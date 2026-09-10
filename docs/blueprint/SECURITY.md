# Security Infrastructure Blueprint

The E-Shop project implements a **Defense-in-Depth** security model to protect user data and ensure transactional integrity.

## 🛡️ Next.js 16 Security Proxy (`proxy.ts`)

Following the Next.js 16 standard, the project uses a centralized `proxy.ts` (Edge Middleware) for infrastructure-level security.

### 1. Security Headers

The proxy injects mandatory enterprise headers into every response:

- **Content-Security-Policy (CSP)**: Nonce-based policy for script/style protection.
- **Strict-Transport-Security (HSTS)**: 1-year max-age with subdomains.
- **X-Frame-Options**: `DENY` to prevent clickjacking.
- **X-Content-Type-Options**: `nosniff` to prevent MIME sniffing.

### 2. Rate Limiting

Authenticated traffic is rate-limited at the edge using the `rate-limiter.ts` utility (Upstash Redis backed).

- **Auth Routes**: Strict limits to prevent brute-force attacks.
- **General API**: Balanced limits for high-performance dashboarding.

## 🔐 Authentication & RBAC

### 1. Identity Provider

- **Keycloak OIDC**: Centralized identity and role management.
- **NextAuth v4**: Session bridging and JWT orchestration.

### 2. Permission Registry (`lib/auth/permissions.ts`)

Role-Based Access Control (RBAC) is centralized to prevent logic drift.

- **`canAccessSeller`**: Check for `SELLER` or `ADMIN` roles.
- **`canAccessDelivery`**: Check for `DELIVERY_AGENT` or `ADMIN` roles.
- **`isResourceOwner`**: Verification of data ownership.

## 🧼 Validation & Sanitization

- **Zod**: Mandatory runtime validation for every API request and form submission.
- **DOMPurify**: Sanitization of user-provided HTML/Content.
- **Type Safety**: Zero `any` policy to prevent runtime undefined access.
