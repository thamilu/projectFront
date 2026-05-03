# Keycloak Configuration Guide — EShop (frontend + backend)

This document provides exact, copy-paste friendly steps to configure Keycloak for the EShop application.
It shows how to create two clients in the same realm: a Public PKCE client for the browser SPA (`eshop-client`)
and a Confidential client for the server/API (`eshop-backend`). Follow these steps in the Keycloak Admin Console.

---

## 1. Realm

- Recommended: create a single realm named `eshop`.
- Only create additional realms if you require tenant isolation.

## 2. Create `eshop-client` (Frontend — Public + PKCE)

1. Keycloak → Select Realm `eshop` → Clients → Create.
   - Client ID: `eshop-client`
   - Client Protocol: `openid-connect`
   - Root URL: `http://localhost:3000` (optional)
   - Click `Save`.

2. In `Settings` for `eshop-client` set:
   - Access Type: `public`
   - Standard Flow Enabled: ON
   - Direct Access Grants Enabled: OFF
   - Implicit Flow Enabled: OFF
   - Valid Redirect URIs:
     - `http://localhost:3000/api/auth/keycloak/callback`
     - `https://your-production-domain.com/api/auth/keycloak/callback` (add as needed)
   - Web Origins:
     - `http://localhost:3000`
     - `https://your-production-domain.com`
   - Save.

3. Client scopes & tokens (optional but recommended):
   - Ensure `openid`, `profile`, `email` are available to the client.
   - Access Token Lifespan: 5–15 minutes (tune per product needs).
   - Use PKCE S256 in your frontend implementation.

Notes:
- Public clients must not use client secrets. Use PKCE (S256) to protect the authorization code.
- Do not enable Direct Access Grants (ROPC) in production.

## 3. Create `eshop-backend` (Backend — Confidential)

1. Keycloak → Clients → Create.
   - Client ID: `eshop-backend`
   - Protocol: `openid-connect`
   - Click `Save`.

2. In `Settings` for `eshop-backend` set:
   - Access Type: `confidential`
   - Standard Flow Enabled: ON
   - Direct Access Grants Enabled: OFF
   - Valid Redirect URIs:
     - `http://localhost:3000/api/auth/keycloak/callback` (if your backend handles the callback on the same host)
     - `https://api.your-production-domain.com/api/auth/keycloak/callback` (production backend callback)
   - Web Origins: (backend origin if needed)
   - Save.

3. Credentials tab:
   - Copy the generated **Client Secret**.
   - Store the secret in server environment variables (do **not** expose to the client):
     - `KEYCLOAK_CLIENT_SECRET=<paste-secret-here>`

4. Optional: enable Service Accounts if backend needs client-credentials flows.

Notes:
- Confidential client secret must only be used server-side.
- Use this client for server-to-server token exchanges and privileged flows.

## 4. Environment variables (examples)

Add to frontend `.env.local` (public values):
```
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=eshop
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=eshop-client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add to backend server env (private values):
```
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=eshop
KEYCLOAK_CLIENT_ID=eshop-backend
KEYCLOAK_CLIENT_SECRET=FDnfswrgvxzjeVfvLENeVYotv1CgMLzu
KEYCLOAK_TOKEN_URL=http://localhost:8080/realms/eshop/protocol/openid-connect/token
KEYCLOAK_JWK_URI=http://localhost:8080/realms/eshop/protocol/openid-connect/certs
```

Do NOT prefix confidential secrets with `NEXT_PUBLIC_` and do not commit `.env.local` with secrets.

## 5. Recommended Flow Architectures

Option A — Backend‑mediated exchange (Recommended):
- Frontend (PKCE) starts auth (popup/redirect) → Keycloak returns code to configured callback → Backend (`eshop-backend`) exchanges code for tokens using its secret → Backend issues a secure httpOnly session cookie to the browser.
- Pros: tokens and refresh are kept server-side; safer for e‑commerce payment and order flows.

Option B — Pure SPA PKCE (Client-only):
- Frontend performs code→token exchange using PKCE S256 without a secret.
- Pros: simpler; Cons: client must manage token storage/refresh and is exposed to XSS risks.

## 6. Keycloak Admin step-by-step (field values to paste)

For `eshop-client` (Settings):
- `Access Type`: public
- `Valid Redirect URIs` (example): `http://localhost:3000/api/auth/keycloak/callback`
- `Web Origins`: `http://localhost:3000`

For `eshop-backend` (Settings):
- `Access Type`: confidential
- `Valid Redirect URIs` (example): `http://localhost:3000/api/auth/keycloak/callback`
- Credentials → copy `Secret` and store in server env.

## 7. Verification & debugging checklist

1. Generate authorization URL from the app (Debug page or JSON authorize endpoint). Example:
```
http://localhost:8080/realms/eshop/protocol/openid-connect/auth?client_id=eshop-client&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fkeycloak%2Fcallback&response_type=code&scope=openid+profile+email
```

2. Paste this into a browser (popup) — Keycloak should display the login page and then redirect to the configured `redirect_uri`.

3. If you see `Client not found`:
   - Confirm realm = `eshop`.
   - Confirm `client_id` exactly matches the client in Keycloak.
   - Confirm `Valid Redirect URIs` contains the callback.

4. If you see `Invalid redirect_uri`:
   - Ensure the exact redirect URL is whitelisted (including protocol and path).

5. Test backend token exchange (server-side):
   - POST to token endpoint (`KEYCLOAK_TOKEN_URL`) with `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `client_secret` (if confidential), and `code_verifier` (for PKCE).

## 8. Useful curl examples

# Exchange code for tokens (confidential client):
```
curl -X POST \
  -d "grant_type=authorization_code" \
  -d "code=<CODE_FROM_CALLBACK>" \
  -d "redirect_uri=http://localhost:3000/api/auth/keycloak/callback" \
  -d "client_id=eshop-backend" \
  -d "client_secret=FDnfswrgvxzjeVfvLENeVYotv1CgMLzu" \
  http://localhost:8080/realms/eshop/protocol/openid-connect/token
```

# Exchange code for tokens (public client using PKCE): include `code_verifier` instead of `client_secret`:
```
curl -X POST \
  -d "grant_type=authorization_code" \
  -d "code=<CODE_FROM_CALLBACK>" \
  -d "redirect_uri=http://localhost:3000/api/auth/keycloak/callback" \
  -d "client_id=eshop-client" \
  -d "code_verifier=<CODE_VERIFIER>" \
  http://localhost:8080/realms/eshop/protocol/openid-connect/token
```

## 9. Security checklist
- Use HTTPS in production for all redirect URIs.
- Never expose `KEYCLOAK_CLIENT_SECRET` to the frontend.
- Use short access token TTL and rotate refresh tokens.
- Use httpOnly, Secure cookies when creating server sessions.
- Limit scopes & roles for the frontend client.

## 10. Roles, Protocol Mappers, Token Settings, and Service Accounts

This section describes the recommended role model, how to add protocol mappers so roles appear in tokens, token lifetime recommendations, and how to set up service accounts for the backend client.

### Roles (Realm vs Client)
- **Realm Roles**: Create for global permissions that span multiple clients. Examples: `admin`, `support`, `customer`.
- **Client Roles**: Create when permissions are specific to a client (e.g., `seller_dashboard_manage`).

Recommended role names and purpose:
- `customer` — browse and purchase products.
- `seller` — manage catalogue and view own orders.
- `admin` — full administrative access.
- `support` — view orders and assist customers (limited write).
- `service` — backend-only automation/service account role.

Where to create:
- Realm Roles: Keycloak → Realm Settings → Roles → Add Role.
- Client Roles: Keycloak → Clients → <client> → Roles → Add Role.

Assign roles to users:
- Keycloak → Users → Select user → Role Mappings → Available Roles → Add selected roles.

### Protocol Mappers (include roles in tokens)
Keycloak already places realm roles under `realm_access.roles` and client roles under `resource_access.<client>.roles`. For easier server-side checks you can add mappers that flatten roles into a single `roles` claim.

Add a `roles` mapper (flattened) for a client:
1. Clients → `eshop-client` (or the backend client) → Mappers → Create.
2. Mapper Type: `User Realm Role` (this will include realm roles). Set:
    - Name: `realm-roles-to-roles-claim`
    - Token Claim Name: `roles`
    - Claim JSON Type: `String` (or `JSON` if you prefer array)
    - Add to ID token: ON
    - Add to access token: ON
    - Add to userinfo: ON
    - Multivalued: ON
3. Create another mapper for client roles (if needed): Mapper Type `User Client Role` → select Client ID `eshop-backend` → Token Claim Name `roles` (multivalued). This will add client-scoped roles to the same `roles` claim or separate by prefix if you prefer.

Audience mapping (API audience):
1. Clients → `eshop-backend` → Mappers → Create.
2. Mapper Type: `Audience` (or `Audience` protocol mapper), Name: `audience-api`, Included Client Audience: `eshop-backend`.
3. This ensures the `aud` claim contains the backend API client id so resource servers can validate audience.

Notes:
- `realm_access` and `resource_access` are default claims — you may not need extra mappers unless you want a flattened `roles` claim or a specific `aud` claim.

### Token and Refresh Settings (recommended)
- Access Token Lifespan: 5–15 minutes (realm-level or client-level override).
- Refresh Token Lifespan: 30 minutes to a few hours (use rotation for improved security).
- Refresh Token Rotation: ENABLE (client settings or realm tokens) — prevents replay of refresh tokens.
- Offline Tokens: enable only when needed (long-lived tokens), and protect them tightly.

Where to set:
- Realm → Tokens: default lifespans (affects all clients unless overridden).
- Clients → `Advanced Settings` or `Tokens` (client-specific overrides) — set Access Token Lifespan and Refresh Token settings per client.

### Service Accounts (backend automation)
1. Clients → `eshop-backend` → Service Account Enabled: ON → Save.
2. After enabling, open `Service Account Roles` tab and assign only the required roles (e.g., `service` or specific admin roles).
3. Use the client credentials flow from the backend to request tokens for automation tasks.

### Logout and Token Revocation
- Enable front-channel and/or back-channel logout if you need single sign-out across apps.
- Revoke refresh tokens on logout — configure in client or realm token settings and implement logout endpoints in your backend.

### How to verify roles appear in tokens
1. Login and capture the access token or ID token (use the browser debug tools or userinfo endpoint).
2. Decode the JWT (https://jwt.io or jwt-cli) and inspect claims:
    - `realm_access.roles` should list realm roles.
    - `resource_access` should include client roles by client id.
    - The flattened `roles` claim (if you added a mapper) should contain combined roles.

### Example mapper configuration (copyable)
- Realm roles to `roles` claim:
   - Name: `realm-roles-to-roles-claim`
   - Mapper Type: `User Realm Role`
   - Token Claim Name: `roles`
   - Claim JSON Type: `JSON`
   - Add to ID token: ON
   - Add to access token: ON
   - Multivalued: ON

- Client roles to `roles` claim:
   - Name: `client-roles-to-roles-claim`
   - Mapper Type: `User Client Role`
   - Client ID: `eshop-backend`
   - Token Claim Name: `roles`
   - Claim JSON Type: `JSON`
   - Add to ID token: ON
   - Add to access token: ON
   - Multivalued: ON

## 11. Final checklist (roles & mappers)
- [ ] Create Realm roles: `customer`, `seller`, `admin`, `support`, `service`.
- [ ] Create client roles where needed (e.g., `seller_dashboard_manage`).
- [ ] Add protocol mappers to include roles in tokens (realm + client mappers if desired).
- [ ] Assign roles to test users and service accounts.
- [ ] Tune Access/Refresh token lifespans and enable refresh token rotation.
- [ ] Test tokens and API access for each role.

---

If you'd like, I can also:
- (A) Produce a click-by-click screenshot-style guide for the Keycloak admin pages.
- (B) Implement the backend-mediated exchange in this repository: add a server callback route that uses `eshop-backend` and `KEYCLOAK_CLIENT_SECRET` to exchange the code and create a session cookie.
- (C) Add CI checks or a small script to automate Keycloak client creation via the Keycloak Admin API.

Pick one and I will proceed.
