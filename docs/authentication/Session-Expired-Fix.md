# 🔴 Session Expired - Immediate Fix

## Problem
Your session expired **10 hours ago** and the refresh token is no longer active in Keycloak. This is why you're getting:
```json
{"error":"invalid_grant","error_description":"Token is not active"}
```

## ✅ Immediate Solution (Do this NOW)

### 1. **Clear Your Browser Cookies**
Open DevTools (F12) → Application → Cookies → `localhost:3000`

Delete these cookies:
- `next-auth.session-token`
- `next-auth.csrf-token`
- `next-auth.callback-url`
- `next-auth.state`
- `next-auth.pkce.code_verifier`

**OR** use this in browser console:
```javascript
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### 2. **Restart Your Next.js Server**
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 3. **Clear Keycloak Session**
Go to: http://localhost:8080/realms/eshop/account

Click "Sign out" to clear any lingering Keycloak sessions.

### 4. **Login Fresh**
1. Go to http://localhost:3000
2. Click "Sign In"
3. Complete the login flow

---

## What I Fixed in the Code

### ✅ 1. **Detect Inactive Tokens**
[src/lib/auth/token-service.ts](src/lib/auth/token-service.ts) now detects `"Token is not active"` errors and clears the refresh token to force re-login.

### ✅ 2. **Clear Session on Error**
[app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts) now returns an empty session when token errors occur, forcing re-authentication.

### ✅ 3. **Auto-Logout on Session Error**
[src/components/NextAuthProvider.tsx](src/components/NextAuthProvider.tsx) now detects session errors and automatically logs you out, redirecting to the login page.

---

## Registration Issue - Email Verification

The error "Failed to send email, please try again later" is separate from the token issue. It's because:

### **Keycloak Email Not Configured**

You need to configure SMTP in Keycloak for email verification to work.

#### Option 1: **Disable Email Verification** (Quick fix for dev)

1. Go to Keycloak Admin → Realm Settings → Login
2. Turn OFF "Verify email"
3. Save

Now users won't need email verification during registration.

#### Option 2: **Configure SMTP** (Production setup)

1. Go to Keycloak Admin → Realm Settings → Email
2. Configure SMTP settings:
   ```
   Host: smtp.gmail.com (or your provider)
   Port: 587
   From: your-email@gmail.com
   Enable StartTLS: ON
   Username: your-email@gmail.com
   Password: [app password or regular password]
   ```
3. Click "Test connection"
4. Save

For Gmail:
- Use an [App Password](https://myaccount.google.com/apppasswords) (not your regular password)
- Or use services like Mailtrap for dev/testing

---

## Expected Behavior After Fix

### ✅ What you should see:
```
[auth] Token refresh check { shouldRefresh: false, timeUntilExpirySeconds: 270 }
[auth] Token refresh check { shouldRefresh: false, timeUntilExpirySeconds: 240 }
...
[auth] Token refresh check { shouldRefresh: true, timeUntilExpirySeconds: 25 }
[auth] Refreshing access token
[auth] refreshAccessToken success
```

### ✅ No more errors like:
- ❌ `invalid_grant`
- ❌ `Token is not active`
- ❌ Session expired unexpectedly

---

## Test the Fix

1. **Clear cookies** (see step 1 above)
2. **Restart Next.js**
3. **Login**
4. **Wait 4-5 minutes** (token expires in 5 min)
5. **Navigate to any page** - should auto-refresh token
6. **Check logs** - should see successful refresh

---

## Keycloak Settings Checklist

In Keycloak Admin → Clients → `eshop-client`:

### **Settings Tab**
- Valid Redirect URIs: `http://localhost:3000/*`
- Valid Post Logout Redirect URIs: `http://localhost:3000/*`

### **Advanced Settings** (scroll down)
| Setting | Value |
|---------|-------|
| **Use Refresh Tokens** | ✅ **ON** |
| Client authentication | ❌ OFF |
| OAuth 2.0 Device Authorization Grant | ❌ OFF |
| Refresh Token Max Reuse | 0 |
| Revoke Refresh Token | ❌ OFF |
| Access Token Lifespan | 5 minutes |
| SSO Session Idle | 30 minutes |
| SSO Session Max | 8 hours |

### **Login Tab** (for registration fix)
- ❌ **Verify email** - Turn OFF for dev (or configure SMTP)
- ✅ **User registration** - ON
- ✅ **Forgot password** - ON
- ✅ **Remember me** - ON

---

## Quick Debug Commands

### Check current session:
```bash
curl http://localhost:3000/api/auth/session
```

### Check Keycloak token endpoint:
```bash
curl http://localhost:8080/realms/eshop/.well-known/openid-configuration
```

### View Next.js logs:
```bash
npm run dev
# Watch for [auth] logs
```

---

## Why This Happened

1. You logged in successfully
2. Token was issued with 5-minute expiry
3. You left the app idle for ~10 hours
4. Both access token AND refresh token expired
5. Keycloak rejected the refresh attempt: `"Token is not active"`
6. Session was stuck in invalid state

The new code fixes this by:
- Detecting inactive tokens
- Clearing the bad session
- Forcing re-authentication
- Preventing future stuck sessions

---

## Summary

🔴 **RIGHT NOW:**
1. Clear browser cookies for localhost:3000
2. Restart Next.js (`npm run dev`)
3. Clear Keycloak session at http://localhost:8080/realms/eshop/account
4. Login fresh

🔧 **For Registration:**
- Disable "Verify email" in Keycloak (or configure SMTP)

✅ **Code is fixed** - expired sessions will now auto-logout and force re-login

---

**Created:** December 30, 2025  
**Issue:** `invalid_grant` - Token is not active  
**Root Cause:** Session expired (10+ hours old), refresh token inactive  
**Solution:** Clear cookies + restart + auto-logout on session errors
