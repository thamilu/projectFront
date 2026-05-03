# Seller Onboarding Implementation Status

**Last Updated:** January 11, 2026  
**Status:** ✅ Frontend Complete | ⏳ Backend Pending

---

## ✅ Frontend Implementation Complete

### 1. Core Types & Validation

- [x] `features/seller/types.ts` - TypeScript interfaces for seller domain
  - SellerType enum (INDIVIDUAL, BUSINESS, FARMER, WHOLESALER, RETAILER, MANUFACTURER, DISTRIBUTOR, BRAND_OWNER)
  - SellerProfile interface
  - API request/response types
- [x] `features/seller/schemas.ts` - Zod validation schemas
  - sellerOnboardingSchema (with acceptedTerms)
  - sellerProfileUpdateSchema (without acceptedTerms)
  - Form data types

### 2. API Client

- [x] `features/seller/api.ts` - Frontend API methods
  - registerSeller() - POST /api/v1/sellers/register
  - getSellerProfile() - GET /api/v1/sellers/profile
  - updateSellerProfile() - PUT /api/v1/sellers/profile

### 3. UI Components

- [x] `features/seller/components/SellerOnboardingForm.tsx`
  - Multi-step registration form
  - Seller type selection
  - Business information collection
  - Terms acceptance
  - Full validation with Zod
  - Error handling with toast notifications
  - **Updated:** Button text changed from "Create Seller Account" to "Create Seller Profile"

### 4. Pages & Routes

- [x] `app/seller/onboard/page.tsx` - Onboarding landing page
  - Marketing content
  - Benefits section
  - Embedded registration form
- [x] `app/seller/profile/page.tsx` - Profile management
  - View existing profile
  - Edit profile information
  - Form validation
  - Save changes
- [x] `app/seller/page.tsx` - Seller dashboard
  - Enhanced error detection
  - Detects "User is not a seller" error
  - Redirects to onboarding when needed
  - Shows retry and onboarding options

### 5. Navigation & Auth

- [x] `components/layout/header.tsx` - Conditional routing
  - Detects SELLER role from JWT
  - Routes sellers to `/seller/profile`
  - Routes others to `/settings/profile`
- [x] `features/auth/components/user-nav.tsx` - User dropdown
  - Same conditional routing logic

### 6. Documentation

- [x] `docs/SELLER_ONBOARDING_IMPLEMENTATION.md` - Complete backend guide
  - Entity structure
  - DTO definitions
  - Service layer logic
  - Controller endpoints
  - Database migration SQL
  - Request/response examples

---

## ⏳ Backend Implementation Needed

### Required Endpoints

#### 1. Register Seller

```
POST /api/v1/sellers/register
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "sellerType": "INDIVIDUAL" | "BUSINESS" | "FARMER" | "WHOLESALER" | "RETAILER" | "MANUFACTURER" | "DISTRIBUTOR" | "BRAND_OWNER",
  "displayName": "My Store",
  "businessName": "Optional Legal Name",
  "email": "seller@example.com",
  "phone": "+1234567890",
  "taxId": "Optional tax ID",
  "description": "Store description",
  "acceptedTerms": true
}

Response (201 Created):
{
  "success": true,
  "sellerId": "uuid-or-id",
  "profile": { ... },
  "message": "Seller profile created successfully"
}

Response (400 Bad Request):
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "User already has a seller profile",
  "instance": "/api/v1/sellers/register"
}
```

#### 2. Get Seller Profile

```
GET /api/v1/sellers/profile
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "id": "uuid",
  "userId": "user-id",
  "sellerType": "INDIVIDUAL",
  "displayName": "My Store",
  "businessName": "Legal Name",
  "email": "seller@example.com",
  "phone": "+1234567890",
  "taxId": "TAX123",
  "description": "Store description",
  "status": "ACTIVE",
  "createdAt": "2026-01-11T10:00:00Z",
  "updatedAt": "2026-01-11T10:00:00Z"
}

Response (404 Not Found):
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Seller profile not found",
  "instance": "/api/v1/sellers/profile"
}
```

#### 3. Update Seller Profile

```
PUT /api/v1/sellers/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "sellerType": "BUSINESS",
  "displayName": "Updated Store Name",
  "businessName": "Updated Legal Name",
  "email": "updated@example.com",
  "phone": "+1987654321",
  "taxId": "NEWTAX456",
  "description": "Updated description"
}

Response (200 OK):
{
  "id": "uuid",
  "userId": "user-id",
  "sellerType": "BUSINESS",
  "displayName": "Updated Store Name",
  ...
}

Response (404 Not Found):
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Seller profile not found",
  "instance": "/api/v1/sellers/profile"
}
```

### Database Schema

```sql
CREATE TABLE seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL UNIQUE,
    seller_type VARCHAR(20) NOT NULL CHECK (seller_type IN ('INDIVIDUAL', 'BUSINESS', 'FARMER', 'WHOLESALER', 'RETAILER', 'MANUFACTURER', 'DISTRIBUTOR', 'BRAND_OWNER')),
    display_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(200),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tax_id VARCHAR(50),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_status ON seller_profiles(status);
CREATE INDEX idx_seller_profiles_seller_type ON seller_profiles(seller_type);
```

### Backend Implementation Checklist

- [ ] Create `SellerProfile` entity (JPA)
- [ ] Create enum types: `SellerType`, `SellerStatus`
- [ ] Create DTOs: `SellerRegisterRequest`, `SellerProfileResponse`, `SellerProfileUpdateRequest`
- [ ] Create `SellerRepository` interface
- [ ] Create `SellerService` with business logic
  - [ ] registerSeller() - validate & create profile
  - [ ] getSellerProfile() - fetch by userId
  - [ ] updateSellerProfile() - validate & update
  - [ ] checkSellerExists() - helper method
- [ ] Create `SellerController` with endpoints
  - [ ] POST /api/v1/sellers/register
  - [ ] GET /api/v1/sellers/profile
  - [ ] PUT /api/v1/sellers/profile
- [ ] Add security configuration
  - [ ] Require ROLE_SELLER for all endpoints
  - [ ] Extract userId from JWT SecurityContext
- [ ] Database migration script
- [ ] Integration tests
- [ ] Update existing `/api/v1/dashboard/seller` to check profile exists

---

## 🧪 Testing Plan

### Frontend Testing (Ready to Test)

1. **Onboarding Flow**
   - [ ] Visit `/seller/onboard` as guest
   - [ ] Fill out registration form
   - [ ] Submit and verify redirect to `/seller`
   - [ ] Verify success toast appears

2. **Profile Management**
   - [ ] Login with SELLER role
   - [ ] Visit `/seller/profile`
   - [ ] Verify profile loads correctly
   - [ ] Edit profile fields
   - [ ] Save changes and verify success

3. **Navigation**
   - [ ] Verify user dropdown routes to `/seller/profile` for sellers
   - [ ] Verify user dropdown routes to `/settings/profile` for non-sellers

4. **Error Handling**
   - [ ] Test with invalid data (validation errors)
   - [ ] Test with network errors
   - [ ] Test session expiry during submission

### Backend Testing (After Implementation)

1. **API Endpoints**
   - [ ] Test register endpoint with valid data
   - [ ] Test register endpoint with duplicate user
   - [ ] Test get profile endpoint
   - [ ] Test get profile endpoint with no profile (404)
   - [ ] Test update endpoint with valid data
   - [ ] Test update endpoint with no profile (404)

2. **Authorization**
   - [ ] Verify endpoints require ROLE_SELLER
   - [ ] Verify JWT token validation
   - [ ] Test with expired token
   - [ ] Test with invalid role

3. **Database**
   - [ ] Verify unique constraint on user_id
   - [ ] Verify foreign key constraint
   - [ ] Test cascade delete

---

## 🚀 Deployment Checklist

### Frontend

- [x] All TypeScript errors resolved
- [x] Build succeeds (`npm run build`)
- [x] Environment variables documented
- [x] Error handling implemented
- [x] Loading states implemented
- [x] Toast notifications configured

### Backend (Pending)

- [ ] Database migration applied
- [ ] Endpoints implemented and tested
- [ ] Security configuration updated
- [ ] API documentation generated (Swagger)
- [ ] Integration tests passing
- [ ] Error responses follow RFC7807 format

---

## 📝 Notes

### Architecture Decisions

1. **Two-Tier Seller System**
   - Keycloak manages ROLE_SELLER (authentication)
   - Database manages seller profiles (business data)
   - Single SELLER role + profile.sellerType enum (not multiple roles)

2. **Error Handling**
   - Frontend parses RFC7807 problem+json responses
   - Extracts: detail, title, message, x-correlation-id
   - Business validation failures (400) trigger onboarding flow
   - Auth failures (401/403) trigger logout

3. **Validation Strategy**
   - Zod schemas on frontend for immediate feedback
   - Backend validation for security and data integrity
   - Two schemas: onboarding (with terms) vs profile update (without terms)

4. **UX Improvements**
   - Clear naming: "Profile" creation vs "Account" registration
   - Automatic detection of missing profile
   - Guided onboarding flow with benefits section
   - Conditional navigation based on role

### Known Limitations

1. **Backend Not Implemented**
   - Frontend will receive 404 errors until backend is ready
   - Use network mocking or backend stubs for local dev

2. **Payment Integration**
   - Seller payout configuration not yet implemented
   - Will need Stripe Connect or similar integration

3. **Product Management**
   - Sellers cannot create products yet
   - Product creation UI needs to be built

### Next Steps

1. **Immediate (Backend Team)**
   - Implement 3 seller endpoints
   - Create database migration
   - Add integration tests

2. **Short-term (Frontend Team)**
   - Add product creation UI for sellers
   - Implement seller dashboard analytics
   - Add file upload for business documents

3. **Medium-term (Full Stack)**
   - Implement payment/payout integration
   - Add seller verification workflow
   - Build admin approval system for new sellers

---

## 🤝 Related Documentation

- [Backend Implementation Guide](./docs/SELLER_ONBOARDING_IMPLEMENTATION.md) - Detailed backend implementation steps
- [Authentication Guide](./docs/KEYCLOAK_AUTH_IMPLEMENTATION.md) - Keycloak integration details
- [API Documentation](./docs/api/) - Full API reference

---

**Questions or Issues?**  
Check the [Backend Implementation Guide](./docs/SELLER_ONBOARDING_IMPLEMENTATION.md) for detailed examples and code snippets.
