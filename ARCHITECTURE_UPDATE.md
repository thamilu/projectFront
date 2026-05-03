# Architecture Update: Unified Seller Role

**Date:** January 11, 2026  
**Status:** ✅ Completed

---

## 🎯 Changes Summary

Updated the application architecture to use a **unified seller role** instead of multiple seller-specific roles.

### Before (Old Architecture):

- ❌ Multiple Keycloak roles: `ROLE_FARMER`, `ROLE_WHOLESALER`, `ROLE_RETAILER`, `ROLE_SHOP`
- ❌ Separate dashboards for each seller type: `/farmer`, `/wholesale`, `/retail`, `/shop`
- ❌ Complex role management in Keycloak
- ❌ Duplicated code across seller dashboards

### After (New Architecture):

- ✅ **Single Keycloak role:** `ROLE_SELLER`
- ✅ **Seller types stored in database:** `seller_profiles.seller_type`
- ✅ **Unified dashboard:** All sellers use `/seller`
- ✅ **5 seller types:** INDIVIDUAL, BUSINESS, FARMER, WHOLESALER, RETAILER
- ✅ **Simple role management:** Only 4 core Keycloak roles needed

---

## 🔑 Core Keycloak Roles

Only **4 authentication roles** in Keycloak:

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
  DELIVERY_AGENT = 'DELIVERY_AGENT',
}
```

---

## 🏪 Seller Types (Database Field)

Seller type is **selected during onboarding** and stored in `seller_profiles` table:

```typescript
export enum SellerType {
  INDIVIDUAL = 'INDIVIDUAL', // Individual sellers
  BUSINESS = 'BUSINESS', // Business/Company sellers
  FARMER = 'FARMER', // Agricultural producers
  WHOLESALER = 'WHOLESALER', // Bulk/wholesale sellers
  RETAILER = 'RETAILER', // Retail store owners
}
```

---

## 📁 File Changes

### ✅ Updated Files

1. **[types/index.ts](types/index.ts)**
   - Updated `UserRole` enum (already had 4 core roles)
   - Updated `SellerType` enum from `{FARMER, RETAIL, WHOLESALER, SHOP}` to `{INDIVIDUAL, BUSINESS, FARMER, WHOLESALER, RETAILER}`
   - Updated comment to clarify seller types are database fields

2. **[app/not-found.tsx](app/not-found.tsx)**
   - Changed "Browse Products" button link from `/shop` to `/products`

3. **[lib/config/site.ts](lib/config/site.ts)**
   - Removed `{ title: 'Shop', href: '/shop' }` from main navigation

### ❌ Removed Folders

Deleted 4 folders that were based on old seller-specific roles:

- **app/farmer/** - Was for ROLE_FARMER
- **app/wholesale/** - Was for ROLE_WHOLESALER
- **app/retail/** - Was for ROLE_RETAILER
- **app/shop/** - Was for ROLE_SHOP

### ✅ Kept Files (Unchanged)

All seller functionality now consolidated in:

- **app/seller/** - Unified seller dashboard
  - `app/seller/page.tsx` - Main dashboard (all sellers)
  - `app/seller/onboard/page.tsx` - Onboarding flow with seller type selection
  - `app/seller/profile/page.tsx` - Profile management

---

## 🔄 User Flow

### New Seller Registration:

1. **User creates account in Keycloak** (standard registration)
2. **Admin assigns ROLE_SELLER** in Keycloak
3. **User logs in** with SELLER role
4. **User visits `/seller`** → Backend returns "User is not a seller" error
5. **Frontend detects error** → Shows onboarding prompt
6. **User completes onboarding form:**
   - Selects seller type (INDIVIDUAL, BUSINESS, FARMER, etc.)
   - Enters business information
   - Accepts terms
7. **Frontend calls** `POST /api/v1/sellers/register`
8. **Backend creates** `seller_profiles` row with selected type
9. **User redirected to** `/seller` → Dashboard loads successfully

### Seller Type Selection:

During onboarding, users see a dropdown with these options:

```tsx
<Select name="sellerType">
  <option value="INDIVIDUAL">Individual Seller</option>
  <option value="BUSINESS">Business/Company</option>
  <option value="FARMER">Farmer/Agricultural Producer</option>
  <option value="WHOLESALER">Wholesaler/Bulk Seller</option>
  <option value="RETAILER">Retailer/Shop Owner</option>
</Select>
```

---

## 🎨 UI/UX Changes

### Dashboard Display

The unified `/seller` dashboard can conditionally display type-specific widgets:

```tsx
// Example: Type-specific content
if (sellerProfile.sellerType === 'FARMER') {
  // Show harvest schedule, crop management
} else if (sellerProfile.sellerType === 'WHOLESALER') {
  // Show bulk order management, inventory
} else if (sellerProfile.sellerType === 'RETAILER') {
  // Show store management, customer analytics
}
```

### Navigation

All sellers see the same navigation:

- Profile dropdown → `/seller/profile` (not type-specific routes)
- Dashboard → `/seller` (unified dashboard)

---

## 🗄️ Database Schema

### seller_profiles Table

```sql
CREATE TABLE seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL UNIQUE,
    seller_type VARCHAR(20) NOT NULL CHECK (
        seller_type IN ('INDIVIDUAL', 'BUSINESS', 'FARMER', 'WHOLESALER', 'RETAILER')
    ),
    display_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(200),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tax_id VARCHAR(50),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔐 Authorization

### Role Checks (Frontend)

All seller pages check for single role:

```tsx
// Before (OLD) - checking specific seller roles
if (
  !user?.roles?.includes('FARMER') &&
  !user?.roles?.includes('WHOLESALER') &&
  !user?.roles?.includes('RETAILER')
) {
  // Redirect
}

// After (NEW) - checking unified SELLER role
if (!user?.roles?.includes('SELLER')) {
  router.push('/login');
}
```

### Role Checks (Backend)

All seller endpoints check for single role:

```java
// Before (OLD)
@PreAuthorize("hasAnyRole('FARMER', 'WHOLESALER', 'RETAILER', 'SHOP')")

// After (NEW)
@PreAuthorize("hasRole('SELLER')")
```

---

## ✅ Verification Checklist

- [x] SellerType enum updated with new values
- [x] Old seller-specific folders removed (farmer, wholesale, retail, shop)
- [x] Navigation links updated (removed /shop reference)
- [x] TypeScript type checking passes
- [x] .next cache cleaned
- [x] No hardcoded references to old routes remain
- [x] All seller pages check for 'SELLER' role only
- [x] Seller onboarding form has type selection dropdown
- [x] Documentation updated

---

## 🧪 Testing Recommendations

### Manual Testing:

1. **Onboarding Flow:**
   - [ ] Login with ROLE_SELLER
   - [ ] Visit `/seller` → Should show onboarding prompt
   - [ ] Complete onboarding with each seller type
   - [ ] Verify profile saved correctly

2. **Profile Management:**
   - [ ] Visit `/seller/profile`
   - [ ] Change seller type
   - [ ] Save changes
   - [ ] Verify updates persist

3. **Navigation:**
   - [ ] Verify all navigation links work
   - [ ] No 404 errors for old routes
   - [ ] Profile dropdown routes to `/seller/profile`

4. **Authorization:**
   - [ ] Test with CUSTOMER role → Should not access `/seller`
   - [ ] Test with SELLER role → Should access all seller pages
   - [ ] Test with no profile → Should show onboarding

### Backend Testing:

1. **Database:**
   - [ ] Create seller_profiles table with CHECK constraint
   - [ ] Test with each seller_type value
   - [ ] Verify unique constraint on user_id

2. **API Endpoints:**
   - [ ] POST /api/v1/sellers/register with each type
   - [ ] GET /api/v1/sellers/profile
   - [ ] PUT /api/v1/sellers/profile
   - [ ] Verify @PreAuthorize("hasRole('SELLER')") works

---

## 📊 Benefits of New Architecture

### Simplified Role Management

- ✅ Only 4 Keycloak roles to manage (vs 7+ before)
- ✅ Easier to assign roles to users
- ✅ Less complex role hierarchy

### Code Maintainability

- ✅ Single seller codebase instead of 4 duplicated dashboards
- ✅ Easier to add new seller types (database only, no Keycloak changes)
- ✅ Consistent UX across all seller types

### Flexibility

- ✅ Users can change seller type without Keycloak admin intervention
- ✅ Can add new seller types without deploying Keycloak changes
- ✅ Easier to implement type-specific features conditionally

### Performance

- ✅ Fewer role checks in authorization
- ✅ Simpler JWT tokens (fewer roles)
- ✅ Less code duplication = smaller bundle size

---

## 🚀 Next Steps

### Immediate (Backend):

1. Update all seller endpoints to use `@PreAuthorize("hasRole('SELLER')")`
2. Create/update `seller_profiles` table with new enum values
3. Remove any code checking for old roles (FARMER, WHOLESALER, RETAILER, SHOP)

### Short-term:

1. Implement type-specific dashboard widgets in `/seller`
2. Add seller type change functionality in profile settings
3. Create admin tool to bulk-migrate existing sellers

### Long-term:

1. Add analytics per seller type
2. Implement type-specific onboarding flows
3. Add seller type verification workflow

---

## 📝 Migration Notes

### For Existing Deployments:

If you have existing users with old roles:

1. **Keycloak Migration:**

   ```sql
   -- Assign ROLE_SELLER to all users with old seller roles
   UPDATE users SET roles = ARRAY['SELLER']
   WHERE roles && ARRAY['FARMER', 'WHOLESALER', 'RETAILER', 'SHOP'];
   ```

2. **Database Migration:**
   ```sql
   -- Migrate existing seller data to seller_profiles
   INSERT INTO seller_profiles (user_id, seller_type, ...)
   SELECT user_id,
          CASE
            WHEN has_role('FARMER') THEN 'FARMER'
            WHEN has_role('WHOLESALER') THEN 'WHOLESALER'
            WHEN has_role('RETAILER') THEN 'RETAILER'
            WHEN has_role('SHOP') THEN 'BUSINESS'
          END as seller_type,
          ...
   FROM users WHERE ...;
   ```

---

## 📚 Related Documentation

- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Full implementation details
- [docs/BACKEND_QUICK_START.md](docs/BACKEND_QUICK_START.md) - Backend API specifications
- [docs/SELLER_ONBOARDING_IMPLEMENTATION.md](docs/SELLER_ONBOARDING_IMPLEMENTATION.md) - Detailed implementation guide

---

**Questions or Issues?**  
Refer to the implementation documents above or check the seller feature code in `features/seller/`.
