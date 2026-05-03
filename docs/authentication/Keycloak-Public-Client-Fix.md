# 🚨 KEYCLOAK CLIENT CONFIGURATION FIX REQUIRED

## ❌ Current Error

```
client_secret_basic client authentication method requires a client_secret
```

**Root Cause:** Your Keycloak client `eshop-client` is configured as **CONFIDENTIAL** but NextAuth is configured for **PUBLIC** client with PKCE.

---

## ✅ FIX: Configure Keycloak Client as PUBLIC

### **Step 1: Open Keycloak Admin Console**

```
http://localhost:8080/admin
```

Login with admin credentials.

---

### **Step 2: Navigate to Client**

1. Select realm: **`eshop`**
2. Go to **Clients** (left sidebar)
3. Click on **`eshop-client`**

---

### **Step 3: Settings Tab - Update These**

```yaml
General Settings:
  ✅ Client ID: eshop-client

Capability config:
  ❌ Client authentication: OFF        # ← CRITICAL: Must be OFF for public client
  ✅ Authorization: OFF
  ✅ Standard flow: ON
  ✅ Direct access grants: ON
  ❌ Implicit flow: OFF
  ❌ Service accounts roles: OFF
  
OAuth 2.0 Device Authorization Grant:
  ❌ OFF
```

**IMPORTANT:** 
- `Client authentication: OFF` = PUBLIC client
- `Client authentication: ON` = CONFIDENTIAL client

---

### **Step 4: Access Settings**

```yaml
Root URL: 
  (leave empty or http://localhost:3000)

Valid redirect URIs:
  http://localhost:3000/api/auth/callback/keycloak

Valid post logout redirect URIs:
  http://localhost:3000/*

Web origins:
  http://localhost:3000
  
Admin URL:
  (leave empty)
```

---

### **Step 5: Advanced Tab - Enable PKCE**

Scroll down to find:

```yaml
Proof Key for Code Exchange (PKCE) Code Challenge Method:
  ✅ S256        # ← Select this
```

---

### **Step 6: Credentials Tab**

**After setting `Client authentication: OFF`**, this tab should either:
- Disappear completely, OR
- Show "No client credentials available"

❌ **If you still see Client Secret here → Client authentication is still ON → go back to Settings and turn it OFF**

---

### **Step 7: Save and Restart**

1. Click **Save** at the bottom of Settings page
2. **Restart Keycloak** (optional but recommended):
   ```bash
   # If using Docker
   docker restart keycloak-container-name
   
   # If using standalone
   # Stop and start Keycloak server
   ```

---

## 🧪 Test After Changes

### **1. Clear Browser Cookies**

```javascript
// Run in browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **2. Test Login**

```
http://localhost:3000/api/auth/signin/keycloak
```

**Expected:**
- ✅ Redirect to Keycloak login page
- ✅ NO `client_secret_basic` error
- ✅ After login, redirect back to app

---

## 🔍 Verify Configuration

### **Check Well-Known Configuration**

Visit:
```
http://localhost:8080/realms/eshop/.well-known/openid-configuration
```

Look for:
```json
{
  "grant_types_supported": [
    "authorization_code",
    "refresh_token"
  ],
  "code_challenge_methods_supported": [
    "plain",
    "S256"        ← Should be present
  ]
}
```

---

## 📋 Summary: Public vs Confidential

| Setting | Public Client | Confidential Client |
|---------|---------------|---------------------|
| **Client authentication** | ❌ OFF | ✅ ON |
| **Client secret** | ❌ None | ✅ Required |
| **PKCE** | ✅ S256 | Optional |
| **Use case** | SPA, Mobile | Backend server |
| **Frontend (Next.js)** | ✅ Yes | ❌ No |

---

## ❓ Still Having Issues?

### **Check these:**

1. **Keycloak logs**
   ```bash
   docker logs -f keycloak-container-name
   ```

2. **NextAuth debug logs** (already enabled in your config)
   - Look for `GET_AUTHORIZATION_URL` - should NOT include `client_secret`

3. **Browser DevTools → Network**
   - Check the POST to `/api/auth/callback/keycloak`
   - Should NOT send `client_secret` in request

4. **Verify .env.local**
   ```bash
   # Should NOT have:
   # KEYCLOAK_CLIENT_SECRET=...
   
   # Should have:
   KEYCLOAK_CLIENT_ID=eshop-client
   KEYCLOAK_ISSUER=http://localhost:8080/realms/eshop
   ```

---

## 🎯 Once This is Fixed

The login flow will work as:

```
1. Click "Login"
   ↓
2. Frontend: POST /api/auth/signin/keycloak
   ↓
3. NextAuth: Creates PKCE challenge (S256)
   ↓
4. Redirect to: http://localhost:8080/realms/eshop/protocol/openid-connect/auth
   ↓
5. User enters credentials in Keycloak
   ↓
6. Keycloak redirects back with code
   ↓
7. NextAuth exchanges code for tokens (NO client_secret needed)
   ↓
8. ✅ Authenticated!
```

---

Good luck! 🚀
