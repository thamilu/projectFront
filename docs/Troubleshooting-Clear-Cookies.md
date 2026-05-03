# Clear Browser Cookies and Test Login

## ✅ Changes Applied

The frontend is now configured for **PUBLIC client with PKCE** (no client secret).

### Files Updated:
- ✅ `.env.local` - Removed `KEYCLOAK_CLIENT_SECRET`
- ✅ `app/api/auth/[...nextauth]/route.ts` - NextAuth configured for public client
- ✅ Dev server restarted with clean build

---

## 🧹 STEP 1: Clear Browser Data (REQUIRED)

Old session cookies will break the new PKCE flow. Clear them:

### **Option A: Browser DevTools**
1. Open DevTools (F12)
2. Go to **Application** → **Storage** → **Cookies**
3. Select `http://localhost:3000`
4. **Delete ALL cookies** (especially `next-auth.session-token`)
5. Also clear **Local Storage** and **Session Storage**

### **Option B: Browser Console**
Run this in the browser console:
```javascript
// Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear storage
localStorage.clear();
sessionStorage.clear();

// Reload
location.reload();
```

---

## 🚀 STEP 2: Test Keycloak Login

### **Test URL:**
```
http://localhost:3000/api/auth/signin/keycloak
```

### **Expected Flow:**
1. ✅ Browser redirects to Keycloak login page:
   ```
   http://localhost:8080/realms/eshop/protocol/openid-connect/auth?...
   ```

2. ✅ Enter Keycloak credentials and login

3. ✅ Redirects back to:
   ```
   http://localhost:3000/api/auth/callback/keycloak
   ```

4. ✅ Finally redirects to home page, **authenticated**

### **Check Session:**
```
http://localhost:3000/api/auth/session
```
Should return:
```json
{
  "user": {
    "name": "...",
    "email": "..."
  },
  "roles": ["customer"],
  "expires": "..."
}
```

---

## ⚙️ STEP 3: Verify Keycloak Client Settings

Make sure your Keycloak client is configured as **PUBLIC**:

### **Keycloak Admin Console**
1. Go to: `http://localhost:8080/admin`
2. Navigate to: **Clients** → **eshop-client**

### **Settings Tab:**
```
✅ Client authentication: OFF
✅ Standard flow: ON
❌ Direct access grants: OFF
```

### **Advanced Tab:**
```
✅ Proof Key for Code Exchange (PKCE): S256
```

### **Valid Redirect URIs:**
```
http://localhost:3000/api/auth/callback/keycloak
```

### **Web Origins:**
```
http://localhost:3000
```

---

## 🔍 Debug Logs

Watch the terminal for these logs:

### ✅ **Success Pattern:**
```
NextAuth debug GET_AUTHORIZATION_URL {
  url: 'http://localhost:8080/realms/eshop/protocol/openid-connect/auth?client_id=eshop-client&scope=openid%20email%20profile&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fkeycloak&code_challenge_method=S256...
```

### ❌ **Error Pattern (if still broken):**
```
client_secret_basic client authentication method requires a client_secret
```
→ If you see this, `KEYCLOAK_CLIENT_SECRET` is still set somewhere

---

## 🔗 Backend Communication

Once login works, test backend API:

### **Test Protected Endpoint:**
```javascript
// From browser console (after login)
fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
  }
})
.then(r => r.json())
.then(console.log);
```

The proxy in `next.config.js` automatically forwards `/api/*` to `http://localhost:8082/*`.

---

## 📝 Summary

**What Changed:**
- ❌ Removed `KEYCLOAK_CLIENT_SECRET` from `.env.local`
- ✅ NextAuth now uses **PKCE** (public client)
- ✅ No client secret sent to Keycloak
- ✅ Frontend ↔ Keycloak works with Authorization Code + PKCE flow

**Architecture:**
```
Browser
  ↓ [PKCE Challenge]
NextAuth (Public Client)
  ↓ [Authorization Code]
Keycloak
  ↓ [JWT Access Token]
Spring Boot (Resource Server)
```

**Next Steps:**
1. Clear browser cookies (REQUIRED)
2. Test login at `/api/auth/signin/keycloak`
3. Verify Keycloak client is PUBLIC
4. Start Spring Boot backend on port 8082
5. Test API calls with JWT token

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Still see `client_secret_basic` error | Check `.env.local` - ensure `KEYCLOAK_CLIENT_SECRET` is NOT set |
| Redirect loop | Clear all cookies and restart browser |
| 401 Unauthorized | Check Spring Boot is accepting JWT from Keycloak issuer |
| CORS error | Add `http://localhost:3000` to Keycloak Web Origins |
| Image 404s | Unrelated to auth - add images to `/public/images/` |

---

Good luck! 🚀
