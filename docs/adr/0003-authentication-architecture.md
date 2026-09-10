# ADR 0003: Authentication Architecture

## Status

Accepted

## Context

The E-Shop platform requires a robust, enterprise-grade authentication system that supports multiple identity providers (initially Keycloak), Role-Based Access Control (RBAC), and secure token management in a Next.js environment.

## Decision

We have implemented a layered authentication architecture that decouples business logic from infrastructure details.

### 1. Identity Provider (Keycloak)

- Use Keycloak via OIDC for identity management.
- Integrate via `next-auth` for session management and OIDC middleware.

### 2. Token Lifecycle & Management

- **Access Tokens**: Short-lived, stored in the server-side session. Injected into API requests via `apiClient`.
- **Refresh Tokens**: Managed by `next-auth` server-side. Implemented "sliding session" logic to refresh tokens before expiry.
- **PKCE**: Enforced for the authorization code flow to prevent interception attacks.

### 3. Layered Hooks Abstraction

- **`features/auth/hooks/use-auth`**: The single source of truth for the UI. It provides `user`, `status`, `login()`, `logout()`, and `isAuthenticated`.
- **`lib/auth/`**: Modularized infrastructure containing core config, security validation (PKCE), and token services.

### 4. Role-Based Access Control (RBAC)

- Roles are mapped from Keycloak JWT claims into the `next-auth` user object.
- Permissions are enforced via the `AuthGuard` component and `middleware.ts`.

### 5. SSR & CSR Strategy

- **SSR**: Use `getServerSession` in Server Components for initial auth state.
- **CSR**: Use `SessionProvider` and `useAuth` for interactive UI updates.

## Consequences

- **Positive**: High security, clear separation of concerns, and easy provider swapping.
- **Negative**: Increased complexity in token refresh logic and SSR/CSR synchronization.
