# Keycloak Client Configuration Guide

## Issue Fixed: "Invalid parameter: redirect_uri" during Registration

### Problem
When clicking "Register", Keycloak showed error: **"We are sorry... Invalid parameter: redirect_uri"**

This happened because the redirect URI sent to Keycloak's registration endpoint wasn't in the client's "Valid Redirect URIs" list.

---

## ✅ Solution: Configure Keycloak Client

### Step 1: Access Keycloak Admin Console

1. Open browser: http://localhost:8080
2. Click **"Administration Console"**
3. Login with admin credentials
4. Select realm: **"eshop"**

### Step 2: Configure eshop-client

1. Navigate to: **Clients** → **"eshop-client"**
2. Go to **Settings** tab

### Step 3: Update Redirect URIs

**Valid Redirect URIs** (add these):
```
http://localhost:3000/*
http://localhost:3000/api/auth/callback/keycloak
```

**Valid Post Logout Redirect URIs** (add these):
```
http://localhost:3000/*
```

**Web Origins** (for CORS):
```
http://localhost:3000
```

### Step 4: Verify Client Settings

Make sure these are configured:

- **Client authentication**: `OFF` (Public client)
- **Authorization**: `OFF`
- **Authentication flow**:
  - ✅ Standard flow: `ON`
  - ✅ Direct access grants: `ON` (for token refresh)
  - ❌ Implicit flow: `OFF`
  - ❌ Service accounts roles: `OFF`
- **Proof Key for Code Exchange (PKCE)**:
  - Code Challenge Method: `S256`

### Step 5: Click **Save**

---

## Code Changes Made

### Updated: `src/lib/auth/authConfig.ts`

**Before:**
```typescript
// ❌ Was redirecting to /callback (not registered in Keycloak)
redirect = `${appBase}/callback`;
```

**After:**
```typescript
// ✅ Now redirects to NextAuth callback URL
const redirect = `${appBase}/api/auth/callback/keycloak`;
```

---

## How Registration Flow Works Now

1. User clicks "Register" button
2. App calls `kcAuth.register()`
3. Browser redirects to:
   ```
   http://localhost:8080/realms/eshop/protocol/openid-connect/registrations
   ?client_id=eshop-client
   &response_type=code
   &scope=openid%20profile%20email
   &redirect_uri=http://localhost:3000/api/auth/callback/keycloak
   ```
4. User fills registration form on Keycloak
5. After successful registration, Keycloak redirects back to:
   ```
   http://localhost:3000/api/auth/callback/keycloak?code=...
   ```
6. NextAuth exchanges the code for tokens
7. User is logged in automatically

---

## Testing Registration

1. Navigate to: http://localhost:3000
2. Click **"Register"** or **"Sign Up"**
3. You should see Keycloak's registration page (not an error)
4. Fill in the form:
   - Username
   - Email
   - Password
   - First Name
   - Last Name
5. Click **"Register"**
6. You should be redirected back to the app and logged in

---

## Troubleshooting

### Still getting "Invalid parameter: redirect_uri"?

1. **Clear browser cache and cookies**
2. **Verify Keycloak client settings** were saved
3. **Check the redirect URI in browser URL** when error appears
4. **Ensure wildcards are correct**: `http://localhost:3000/*` (with asterisk)

### Registration form appears but login fails after?

1. Check browser console for errors
2. Check terminal for NextAuth logs
3. Verify token exchange is working: Should see `[next-auth][debug][OAUTH_CALLBACK_RESPONSE]`

### Want to test with production domain?

Add your production domain to Valid Redirect URIs:
```
https://yourdomain.com/*
https://yourdomain.com/api/auth/callback/keycloak
```

---

## Environment Variables Required

From `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Keycloak
KEYCLOAK_ISSUER=http://localhost:8080/realms/eshop
KEYCLOAK_CLIENT_ID=eshop-client

# Public (client-side)
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=eshop
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=eshop-client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Related Files

- [src/lib/auth/authConfig.ts](src/lib/auth/authConfig.ts) - Registration URL builder
- [src/hooks/useKeycloakAuth.ts](src/hooks/useKeycloakAuth.ts) - Auth hook with register()
- [src/components/layout/header.tsx](src/components/layout/header.tsx) - Register button handler
- [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts) - NextAuth config

---

## Summary

✅ **Fixed**: Registration redirect now uses correct NextAuth callback URL
✅ **Required**: Keycloak client must have redirect URIs whitelisted
✅ **Result**: Registration flow works seamlessly with NextAuth + Keycloak

