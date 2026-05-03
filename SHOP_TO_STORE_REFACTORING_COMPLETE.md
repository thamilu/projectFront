# Shop → Store Refactoring Complete ✅

## ⚠️ Note: This Document is Now Outdated

**This refactoring was superseded by the unified seller architecture.**

See [ARCHITECTURE_UPDATE.md](ARCHITECTURE_UPDATE.md) for the current architecture where:

- Single `SELLER` Keycloak role (no separate FARMER/WHOLESALER/RETAILER roles)
- Seller types (INDIVIDUAL, BUSINESS, FARMER, WHOLESALER, RETAILER) stored in database
- Unified `/seller` dashboard for all seller types

---

## Historical Context

This document describes a previous refactoring from "Shop" to "Store" terminology to avoid confusion with backend Shop types (RETAILER, WHOLESALER, FARMER).

## Old Terminology Clarification

- **Backend "Shop"**: Previously referred to seller classification types (RETAILER, WHOLESALER, FARMER) - visible in JWT tokens
- **Frontend "Store"**: Refers to the seller's storefront/marketplace presence - what we manage in seller dashboard
- **Customer-facing "Shop"**: Public shop browsing API (unchanged - customers browse "shops" in marketplace)

## Files Modified

### 1. Type Definitions

**File**: `types/index.ts`

- Added `StoreDTO` interface for seller management context
- Kept `ShopDTO` interface for customer-facing shop browsing
- Both interfaces have identical structure but serve different semantic purposes

### 2. API Layer

**File**: `features/seller/api/seller-api.ts`

- Renamed `getMyShop()` → `getMyStore()`
- Renamed `createShop()` → `createStore()`
- Renamed `updateShop()` → `updateStore()`
- Updated API endpoints: `/seller/shop` → `/seller/store`

### 3. React Query Hooks

**File**: `features/seller/hooks/use-seller.ts`

- Renamed `useSellerShop()` → `useSellerStore()`
- Renamed `useCreateShop()` → `useCreateStore()`
- Renamed `useUpdateShop()` → `useUpdateStore()`
- Updated query keys: `['seller', 'shop']` → `['seller', 'store']`
- Updated success messages to use "store" terminology

**File**: `hooks/queries/use-seller.ts` (legacy file)

- Updated to maintain consistency with new naming

### 4. Query Keys

**File**: `lib/query-keys.ts`

- Updated seller query key from `shop: () => ['seller', 'shop']` to `store: () => ['seller', 'store']`

### 5. Pages & Routes

**Route Change**:

- Moved: `app/seller/shop/create/` → `app/seller/store/create/`

**File**: `app/seller/store/create/page.tsx`

- Renamed component: `CreateShopPage` → `CreateStorePage`
- Updated hook: `useCreateShop` → `useCreateStore`
- Updated mutation variable: `createShopMutation` → `createStoreMutation`
- Updated UI text:
  - "Create Your Shop" → "Create Your Store"
  - "Shop Information" → "Store Information"
  - "Shop Name" → "Store Name"
  - "Shop Description" → "Store Description"
  - "Create Shop" button → "Create Store"
- Updated toast messages: "Shop created successfully" → "Store created successfully"

**File**: `app/seller/settings/page.tsx`

- Updated hook: `useSellerShop` → `useSellerStore`
- Updated variables: `shopData` → `storeData`
- Updated UI text:
  - "Shop Setup Required" → "Store Setup Required"
  - "Create your shop" → "Create your store"
  - "Shop Information" → "Store Information"
  - "Shop Name" → "Store Name"
  - "Shop Description" → "Store Description"
  - "Manage your shop information" → "Manage your store information"
- Updated route: `/seller/shop/create` → `/seller/store/create`
- Fixed property access: `storeData?.name` → `storeData?.shopName` (backend still uses shopName field)

### 6. Components

**File**: `features/seller/components/AddProductForm.tsx`

- Updated hook: `useSellerShop` → `useSellerStore`
- Updated variables:
  - `shopData` → `storeData`
  - `isLoadingShop` → `isLoadingStore`
  - `shopError` → `storeError`
- Updated UI text:
  - "Loading shop information..." → "Loading store information..."
  - "Shop Setup Required" → "Store Setup Required"
  - "Shop not found" → "Store not found"
  - "Create Shop" button → "Create Store"
  - "set up your shop" → "set up your store"
  - "complete your shop setup" → "complete your store setup"
- Updated route: `/seller/shop/create` → `/seller/store/create`
- Note: Backend payload still uses `shopId` field (backend expects this)

## Backend Contract

Frontend now expects these endpoints (backend needs to implement):

- `GET /seller/store` - Fetch seller's store
- `POST /seller/store` - Create new store
- `PUT /seller/store` - Update store

Current backend implementation:

- Backend has `/seller/shop` endpoints but they return 404
- Backend "shops" table exists with `seller_id`, `shop_name`, `description`, etc.
- Backend needs to add new controller endpoints at `/seller/store`

## Data Structure Notes

- The `StoreDTO` and `ShopDTO` interfaces share the same structure
- Backend database field is still `shop_name` (not migrated to `store_name`)
- Product creation still sends `shopId` in payload (backend expects this field name)
- Frontend displays "Store" but backend still uses "Shop" in database schema

## Testing Checklist

✅ TypeScript compilation passes
✅ All imports resolved correctly
✅ Query keys updated
✅ Route paths updated
✅ UI text updated to "Store" terminology
⚠️ Backend endpoints need implementation at `/seller/store`
⚠️ End-to-end store creation flow blocked until backend is ready

## Next Steps

1. **Backend Team**: Implement new controller methods:

   ```java
   @RestController
   @RequestMapping("/seller/store")
   public class SellerStoreController {
       @GetMapping
       public ResponseEntity<ShopDTO> getMyStore() { ... }

       @PostMapping
       public ResponseEntity<ShopDTO> createStore(@RequestBody CreateStoreRequest request) { ... }

       @PutMapping
       public ResponseEntity<ShopDTO> updateStore(@RequestBody UpdateStoreRequest request) { ... }
   }
   ```

2. **Testing**: Once backend endpoints are ready:
   - Test store creation flow
   - Test product creation with store validation
   - Test settings page store update
   - Verify all API calls route through `/api/seller/store`

3. **Future Considerations**:
   - Backend may want to rename database column `shop_name` → `store_name` for consistency
   - Backend may want to rename request/response fields from `shopId` → `storeId`
   - If backend changes field names, frontend will need minor updates to match

## Migration Strategy

This refactoring maintains backward compatibility at the data layer:

- Frontend semantic changes (Shop → Store) don't affect database schema
- Backend can still use "Shop" entity internally
- Only the seller-facing management UI changed terminology
- Customer-facing shop browsing API unchanged (`/api/shops`, `ShopDTO` for products)

## Summary

✅ **Completed**: Frontend refactoring from "Shop" to "Store" for seller management
✅ **Result**: Clear separation between seller management (Store) and seller types (Shop = RETAILER/WHOLESALER/FARMER)
⏳ **Pending**: Backend implementation of `/seller/store` endpoints
📝 **Documentation**: This file serves as the complete change log and migration guide
