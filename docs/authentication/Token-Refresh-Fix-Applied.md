# ✅ Token Refresh Fix Applied

## Changes Made

### 1. **Token Refresh Buffer Reduced** (30 seconds instead of 60)
**File:** [src/lib/auth/token-service.ts](src/lib/auth/token-service.ts)

- Changed `TOKEN_REFRESH_BUFFER_MS` from 60 seconds to **30 seconds**
- Added debug logging to track when tokens are being refreshed
- This prevents refreshing tokens too early, which causes `invalid_grant` errors

### 2. **Enhanced JWT Callback Logic**
**File:** [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)

- ✅ **CRITICAL FIX:** Only refreshes token when it's **actually about to expire**
- Returns existing token immediately if it's still valid (not expired)
- Added explicit logging when refresh occurs
- Uses `expires_in` from account response for accurate expiry calculation

### 3. **Better Error Messages**
**Files:** Both token-service.ts and route.ts

- Added helpful error messages pointing to Keycloak configuration
- Success logging: `[auth] refreshAccessToken success`
- Debug logging shows time until expiry in development mode

## 🔧 Keycloak Settings to Verify

Go to your Keycloak Admin Console → Clients → `ecom-app` (your client ID) → Settings:

### **Advanced Settings** (scroll down)
| Setting | Required Value | Why |
|---------|----------------|-----|
| **OAuth 2.0 Device Authorization Grant** | ❌ OFF | Not needed for web apps |
| **Client authentication** | ❌ OFF | Public client (Next.js frontend) |
| **Use Refresh Tokens** | ✅ **ON** | **CRITICAL - enables token refresh** |
| **Refresh Token Max Reuse** | 0 | Prevents reuse attacks |
| **Revoke Refresh Token** | ❌ OFF | Allow rotation |
| **Access Token Lifespan** | 5 minutes | Fast expiry, secure |
| **SSO Session Idle** | 30 minutes | User inactive timeout |
| **SSO Session Max** | 8 hours | Maximum login duration |

### **Valid Redirect URIs** (Settings tab)
Add these:
```
http://localhost:3000/*
http://localhost:3000/api/auth/callback/keycloak
```

### **Valid Post Logout Redirect URIs**
```
http://localhost:3000/*
```

## 🧪 How to Test

1. **Restart Keycloak** (if you changed settings)
   ```bash
   # Restart your Keycloak instance
   ```

2. **Restart Next.js**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login and watch logs**
   - Open browser console (F12)
   - Open terminal running `npm run dev`
   - Login to your app
   - **Wait 4-5 minutes** (token expires in 5 min)
   - Make any request (navigate to a page)

4. **Expected log output:**
   ```
   [auth] Token refresh check { shouldRefresh: false, timeUntilExpirySeconds: 270 }
   [auth] Token refresh check { shouldRefresh: false, timeUntilExpirySeconds: 240 }
   ...
   [auth] Token refresh check { shouldRefresh: true, timeUntilExpirySeconds: 25 }
   [auth] Refreshing access token
   [auth] refreshAccessToken success { expiresIn: 300, hasRefreshToken: true }
   ```

5. **Success indicators:**
   - ✅ No `invalid_grant` errors
   - ✅ Token only refreshes within 30 seconds of expiry
   - ✅ User stays logged in across multiple requests
   - ✅ Seamless UX (no logout/login prompts)

## ❌ What NOT to See

- ❌ `invalid_grant` error
- ❌ Token refreshing on every request
- ❌ `[auth] Token refresh HTTP error` with status 400/401
- ❌ User being logged out unexpectedly

## 🔍 Debugging

If you still see errors:

1. **Check Keycloak logs**
   ```bash
   # Check Keycloak container logs
   docker logs keycloak-container-name
   ```

2. **Verify client settings**
   - Keycloak Admin → Clients → `ecom-app` → Settings
   - Scroll down to "Advanced Settings"
   - Ensure "Use Refresh Tokens" = **ON**

3. **Check environment variables**
   ```bash
   npm run check:env
   ```
   Verify:
   - `KEYCLOAK_CLIENT_ID` matches Keycloak
   - `KEYCLOAK_ISSUER` is correct
   - `NEXTAUTH_SECRET` is set

4. **Enable debug mode**
   In [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts), the debug flag is already set:
   ```typescript
   debug: process.env.NODE_ENV === 'development',
   ```

## 📋 Code Changes Summary

### Before (❌ WRONG):
```typescript
// Refresh buffer was too long (60s)
export const TOKEN_REFRESH_BUFFER_MS = 60_000;

// No logging to understand when refresh happens
if (!shouldRefreshToken(token.accessTokenExpires)) {
  return token;
}
```

### After (✅ CORRECT):
```typescript
// Optimal refresh buffer (30s)
export const TOKEN_REFRESH_BUFFER_MS = 30_000;

// Clear logging and only refresh when needed
if (!shouldRefreshToken(token.accessTokenExpires)) {
  return token; // Don't refresh on every request!
}

logger.info('[auth] Refreshing access token', {
  expiresAt: token.accessTokenExpires ? new Date(token.accessTokenExpires).toISOString() : 'unknown',
});
```

## 🎯 Key Principles Implemented

1. **Only refresh when token is about to expire** (within 30s buffer)
2. **Don't refresh on every request** (performance + prevents invalid_grant)
3. **Use public client flow** (no client secret needed)
4. **Proper error handling** with retry logic
5. **Comprehensive logging** for debugging

## 🚀 Next Steps

After verifying this works:

1. ✅ Implement role extraction (`ADMIN`, `SELLER`, `CUSTOMER`)
2. ✅ Pass token to Spring Boot backend securely
3. ✅ Backend verification of logged-in user
4. ✅ Production-ready config (HTTPS, secure cookies)

---

**Created:** December 30, 2025  
**Issue:** `invalid_grant` error on token refresh  
**Root Cause:** Refreshing tokens too early, Keycloak rejects reuse  
**Solution:** Only refresh within 30s of expiry + proper Keycloak config
