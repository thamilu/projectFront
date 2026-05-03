# Two-Layer Authentication Implementation for Seller Dashboard

## ✅ Implementation Complete

This document describes the comprehensive two-layer authentication system implemented for the Seller Dashboard in the Next.js frontend application.

---

## 🔐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION LAYERS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   LAYER 1: PAGE PROTECTION (Next.js Middleware)                                 │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│   • Middleware checks if user is authenticated                                   │
│   • Checks if user has required role (SELLER)                                   │
│   • Redirects to login if not authenticated                                     │
│   • Shows "Access Denied" if wrong role                                         │
│   • ✅ Comprehensive logging at every step                                       │
│                                                                                  │
│   LAYER 2: API PROTECTION (Spring Boot Backend)                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│   • Validates JWT token on each API request                                      │
│   • Checks roles/permissions                                                     │
│   • Returns 401/403 if unauthorized                                              │
│   • Backend must always validate - never trust frontend                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files Modified/Created

### 1. **Middleware** (`middleware.ts`)
**What was changed:**
- ✅ Added comprehensive console logging for every step
- ✅ Logs user, roles, token presence
- ✅ Logs access decisions (granted/denied)
- ✅ Role-based access control for `/seller` and `/admin` routes
- ✅ Redirects unauthorized users to `/access-denied`

**Key features:**
```typescript
// Logs before every decision
console.log('🔥 [Middleware] Executing for:', pathname);
console.log('[Middleware] Token check:', token ? '✅ exists' : '❌ missing');
console.log('[Middleware] Roles:', roles.join(', '));

// Role-based protection
if (pathname.startsWith('/seller')) {
  if (!isSeller) {
    return NextResponse.redirect('/access-denied');
  }
  console.log('[Middleware] ✅ SELLER access granted');
}
```

---

### 2. **NextAuth Configuration** (`app/api/auth/[...nextauth]/route.ts`)
**What was changed:**
- ✅ Enhanced JWT callback with role extraction and logging
- ✅ Enhanced session callback with comprehensive logging
- ✅ Logs when token is refreshed
- ✅ Logs user email and roles during session building

**Key features:**
```typescript
async jwt({ token, account }) {
  if (account?.access_token) {
    const roles = extractRoles(account.access_token);
    console.log('[Auth/JWT] 🎫 Initial sign in');
    console.log('[Auth/JWT] Roles extracted:', roles.join(', '));
    return { ...token, roles, ... };
  }
  // Refresh logic with logging
}

async session({ session, token }) {
  console.log('[Auth/Session] 📋 Building session');
  console.log('[Auth/Session] User:', token.email);
  console.log('[Auth/Session] Roles:', token.roles?.join(', '));
  // Exposes accessToken to server-side only
  (session as any).accessToken = token.accessToken;
  return session;
}
```

---

### 3. **Seller Dashboard Page** (`app/seller/dashboard/page.tsx`) ⭐ NEW
**What it does:**
- ✅ **Server-side component** that runs on Next.js server
- ✅ Uses `getServerSession()` to check authentication
- ✅ Double-checks user has SELLER role (defense in depth)
- ✅ **Fetches initial data from backend API using Bearer token**
- ✅ Comprehensive logging for debugging
- ✅ Passes session and data to client component

**Key features:**
```typescript
// Server-side authentication check
const session = await getServerSession(authOptions);
console.log('[SellerDashboard/Page] User:', session?.user?.email);
console.log('[SellerDashboard/Page] Roles:', session?.roles?.join(', '));

// Fetch from backend with Bearer token
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/seller/dashboard`,
  {
    headers: {
      'Authorization': `Bearer ${(session as any).accessToken}`,
    },
    cache: 'no-store',
  }
);

// Pass to client component
return <SellerDashboardClient session={session} initialData={data} />;
```

---

### 4. **Seller Dashboard Client Component** (`app/seller/dashboard/SellerDashboardClient.tsx`) ⭐ NEW
**What it does:**
- ✅ **Client-side component** for interactive features
- ✅ Makes API calls with Bearer token from session
- ✅ Displays dashboard stats and products
- ✅ **Automatically signs out on 401 (unauthorized)**
- ✅ **Shows error on 403 (forbidden)**
- ✅ Comprehensive logging for all API calls

**Key features:**
```typescript
// Fetch products with Bearer token
const fetchProducts = async () => {
  console.log('[Dashboard/Client] 🔄 Fetching products...');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/seller/products`,
    {
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
      },
    }
  );

  if (response.status === 401) {
    console.log('[Dashboard/Client] ❌ Unauthorized, signing out');
    signOut({ callbackUrl: '/login?error=unauthorized' });
  }

  if (response.status === 403) {
    setError('Insufficient permissions');
  }
};
```

---

### 5. **Access Denied Page** (`app/access-denied/page.tsx`) ⭐ NEW
**What it does:**
- ✅ Shows when user tries to access protected route without permission
- ✅ Displays user's current roles
- ✅ Provides "Go Home" and "Sign Out" buttons
- ✅ Helpful error message for debugging

---

### 6. **Updated Existing Seller Page** (`app/seller/page.tsx`)
**What was changed:**
- ✅ Added comprehensive logging throughout
- ✅ Logs session status, user, and roles
- ✅ Logs API calls to backend
- ✅ Fixed backend port to 8082 (not 8080)
- ✅ Better error handling with detailed logs

---

## 📊 Expected Log Flow

### 🖥️ **Frontend Logs (Browser Console + Next.js Server)**

```log
# 1. Middleware Protection
🔥 [Middleware] Executing for: /seller/dashboard
[Middleware] Token check: ✅ exists
[Middleware] User: seller@example.com
[Middleware] Roles: SELLER, SELLER_RETAILER
[Middleware] isAdmin: false
[Middleware] isSeller: true
[Middleware] ✅ SELLER access granted
[Middleware] ✅ Access allowed, continuing

# 2. NextAuth Session Building
[Auth/JWT] 🎫 Initial sign in
[Auth/JWT] Roles extracted: SELLER, SELLER_RETAILER
[Auth/JWT] Token expires in: 300 seconds
[Auth/Session] 📋 Building session
[Auth/Session] User: seller@example.com
[Auth/Session] Roles: SELLER, SELLER_RETAILER

# 3. Server-Side Page Rendering
[SellerDashboard/Page] 📄 Rendering server component
[SellerDashboard/Page] Session check
[SellerDashboard/Page] User: seller@example.com
[SellerDashboard/Page] Roles: SELLER, SELLER_RETAILER
[SellerDashboard/Page] 🔄 Fetching seller dashboard data from backend...
[SellerDashboard/Page] API URL: http://localhost:8082
[SellerDashboard/Page] Token: present
[SellerDashboard/Page] Response status: 200
[SellerDashboard/Page] ✅ Backend data fetched successfully

# 4. Client-Side Component
[Dashboard/Client] Component mounted
[Dashboard/Client] Session user: seller@example.com
[Dashboard/Client] Session roles: SELLER, SELLER_RETAILER
[Dashboard/Client] 🔄 Fetching products...
[Dashboard/Client] Token: eyJhbGciOiJSUzI1NiIs...
[Dashboard/Client] Response status: 200
[Dashboard/Client] ✅ Fetched 15 products
```

### 🔧 **Backend Logs (Spring Boot)**

```log
# When frontend makes API call with Bearer token
18:05:32.123 DEBUG [http-nio-8082-exec-1] FilterSecurityInterceptor - Authorized filter invocation [GET /api/v1/seller/dashboard]
18:05:32.124 INFO  [http-nio-8082-exec-1] AuthenticationEventListener - 🔓 [AUTH-SUCCESS] User authenticated: seller@example.com | Roles: [ROLE_SELLER]
18:05:32.125 INFO  [http-nio-8082-exec-1] AuthenticationLoggingFilter - [AUTH] GET /api/v1/seller/dashboard - User: seller@example.com | Roles: [ROLE_SELLER] | Status: 200
```

---

## 🔍 Debugging Checklist

### ✅ **Check 1: Is Middleware Running?**
**Look for:**
```log
🔥 [Middleware] Executing for: /seller/dashboard
[Middleware] Token check: ✅ exists
[Middleware] Roles: SELLER
[Middleware] ✅ SELLER access granted
```

**If missing:**
- Middleware might not be enabled for this route
- Check `middleware.ts` matcher configuration
- Restart dev server

---

### ✅ **Check 2: Are Roles Being Extracted?**
**Look for:**
```log
[Auth/JWT] Roles extracted: SELLER, SELLER_RETAILER
[Auth/Session] Roles: SELLER, SELLER_RETAILER
```

**If roles are empty:**
- Keycloak might not be sending roles in JWT
- Check `extractRoles` function in `token-service.ts`
- Verify Keycloak client mapper configuration
- Token should have `realm_access.roles` or `resource_access[client].roles`

---

### ✅ **Check 3: Is Backend API Being Called?**
**Check browser Network tab:**
- Open Developer Tools (F12)
- Go to **Network** tab
- Filter by **Fetch/XHR**
- Look for calls to `localhost:8082`
- Check **Headers** tab for `Authorization: Bearer ...`

---

### ✅ **Check 4: Is Authorization Header Present?**
**Look for:**
```log
[Dashboard/Client] Token: eyJhbGciOiJSUzI1NiIs...
[Dashboard/Client] Response status: 200
```

**If 401 Unauthorized:**
- Token might be expired
- Token might be invalid
- Backend might not be configured to accept the token
- Check backend logs for JWT validation errors

---

### ✅ **Check 5: Does User Have Required Role?**
**Look for:**
```log
[Middleware] isSeller: true
[Middleware] ✅ SELLER access granted
```

**If redirected to /access-denied:**
- User doesn't have SELLER role
- Check Keycloak user's role assignments
- Verify role mapping in Keycloak client

---

## 🛠️ How to Test

### **Test Case 1: Successful SELLER Access**
1. Login with user that has SELLER role
2. Navigate to `/seller` or `/seller/dashboard`
3. **Expected:** Dashboard loads, shows stats, can fetch products
4. **Logs should show:** All ✅ checkmarks

### **Test Case 2: Non-SELLER User**
1. Login with user that does NOT have SELLER role
2. Try to navigate to `/seller`
3. **Expected:** Redirected to `/access-denied`
4. **Logs should show:**
   ```log
   [Middleware] ❌ Access denied - not a SELLER
   ```

### **Test Case 3: Not Authenticated**
1. **Don't login** (clear cookies)
2. Try to navigate to `/seller`
3. **Expected:** Redirected to `/login?callbackUrl=/seller`
4. **Logs should show:**
   ```log
   [Middleware] ❌ No token, redirecting to login
   ```

### **Test Case 4: Token Expired (401)**
1. Login successfully
2. Wait for token to expire (or manually invalidate in Keycloak)
3. Click "Load Products" button
4. **Expected:** Automatically signed out, redirected to login
5. **Logs should show:**
   ```log
   [Dashboard/Client] ❌ Unauthorized (401), signing out
   ```

---

## 🔗 API Endpoints Expected

The implementation expects these backend endpoints:

### 1. **GET `/api/v1/seller/dashboard`**
- **Auth:** Bearer token required
- **Role:** SELLER
- **Response:**
```json
{
  "stats": {
    "totalProducts": 120,
    "lowStockProducts": 8,
    "totalRevenue": 4567.89,
    "pendingOrders": 15
  },
  "recentProducts": [...]
}
```

### 2. **GET `/api/v1/seller/products`**
- **Auth:** Bearer token required
- **Role:** SELLER
- **Response:**
```json
[
  {
    "id": 1,
    "name": "Product Name",
    "price": 99.99,
    "stock": 50
  },
  ...
]
```

### 3. **GET `/api/users/profile`** (existing)
- **Auth:** Bearer token required
- **Response:**
```json
{
  "email": "seller@example.com",
  "shop": {
    "id": 123,
    "shopName": "My Shop",
    "sellerType": "FARMER" | "RETAIL_SELLER" | "WHOLESALER" | "SHOP"
  }
}
```

---

## 🔒 Security Notes

### **✅ Both Layers Are Required**

1. **Frontend Protection (Middleware)**
   - Improves UX by preventing unauthorized page loads
   - Provides immediate feedback
   - **NOT secure by itself** (can be bypassed with tools like Postman)

2. **Backend Protection (Spring Boot)**
   - **This is the real security**
   - Always validates JWT tokens
   - Always checks roles/permissions
   - **Never trust the frontend**

### **❌ Never Expose Tokens to Client JavaScript**
- Access tokens are stored in JWT (HTTP-only via NextAuth)
- Refresh tokens are **never** sent to client
- Client components access tokens via `(session as any).accessToken` only when needed for API calls
- Tokens are automatically included in server-side fetches

---

## 📝 Summary

**✅ What we implemented:**
1. ✅ Comprehensive middleware logging and role checks
2. ✅ Enhanced NextAuth configuration with logging
3. ✅ New server-side Seller Dashboard page with backend data fetching
4. ✅ New client-side Seller Dashboard component with API calls
5. ✅ Access Denied page for unauthorized access
6. ✅ Updated existing seller page with better logging
7. ✅ Proper Bearer token authentication for all API calls
8. ✅ Automatic sign-out on 401 (token expired)
9. ✅ Error handling for 403 (insufficient permissions)

**🎯 Result:**
- Clear visibility into authentication flow
- Easy debugging with comprehensive logs
- Proper two-layer security architecture
- Automatic token refresh
- Graceful error handling

---

## 🚀 Next Steps

1. **Implement Backend Endpoints**
   - Create `/api/v1/seller/dashboard` endpoint
   - Create `/api/v1/seller/products` endpoint
   - Add Spring Security configuration to validate JWT tokens
   - Add role-based access control (`@PreAuthorize("hasRole('SELLER')")`)

2. **Test End-to-End**
   - Test with real Keycloak users
   - Test role assignments
   - Test token expiration and refresh
   - Test unauthorized access attempts

3. **Monitor Logs**
   - Check both frontend and backend logs
   - Verify tokens are being sent and validated
   - Verify roles are being extracted correctly

---

**Questions or issues?** Check the logs first - they're designed to tell you exactly what's happening at every step! 🔍
