# Backend Changes Required - Unified Seller Architecture

**Date:** January 11, 2026  
**Priority:** High  
**Status:** Action Required

---

## 🎯 Overview

The frontend has been updated to use a **unified seller architecture**. The backend needs corresponding changes to:

1. Remove old seller-specific roles
2. Update to single SELLER role
3. Update SellerType enum values
4. Create/update seller_profiles table

---

## ❌ CODE TO DELETE

### 1. Remove Old Keycloak Roles

Delete all references to these roles:

```java
// ❌ DELETE THESE ROLES
ROLE_FARMER
ROLE_WHOLESALER
ROLE_RETAILER
ROLE_SHOP
```

**Where to look:**

- Keycloak realm configuration
- Role enum definitions
- `@PreAuthorize` annotations
- Role assignment logic
- Security configuration files

### 2. Delete Old Controller Endpoints (if they exist)

```java
// ❌ DELETE - Farmer-specific endpoints
@RestController
@RequestMapping("/api/v1/farmer")
public class FarmerController { ... }

// ❌ DELETE - Wholesaler-specific endpoints
@RestController
@RequestMapping("/api/v1/wholesale")
public class WholesaleController { ... }

// ❌ DELETE - Retailer-specific endpoints
@RestController
@RequestMapping("/api/v1/retail")
public class RetailerController { ... }

// ❌ DELETE - Shop-specific endpoints
@RestController
@RequestMapping("/api/v1/shop")
public class ShopController { ... }
```

### 3. Delete Old Dashboard Endpoints

```java
// ❌ DELETE these dashboard endpoints
GET /api/v1/dashboard/farmer
GET /api/v1/dashboard/wholesale
GET /api/v1/dashboard/retail
GET /api/v1/dashboard/shop
```

**Replace with:**

```java
// ✅ KEEP - Single unified endpoint
GET /api/v1/dashboard/seller
```

### 4. Seller Enums

**A. Existing: `SellerBusinessType`**
File: `com.eshop.app.enums.SellerBusinessType.java`

```java
package com.eshop.app.enums;

public enum SellerBusinessType {
    FARMER,
    WHOLESALER,
    RETAILER
}
```

**B. NEW: `SellerIdentityType` (Must Create)**
File: `com.eshop.app.enums.SellerIdentityType.java`

```java
package com.eshop.app.enums;

public enum SellerIdentityType {
    INDIVIDUAL,
    BUSINESS
}
```

**NEW (UPDATE TO):**

```java
public enum SellerType {
    INDIVIDUAL,   // ✅ Add
    BUSINESS,     // ✅ Add
    FARMER,       // ✅ Keep
    WHOLESALER,   // ✅ Keep
    RETAILER      // ✅ Add (replaces RETAIL)
}
```

### 5. Delete Old Role Checks

Find and replace all instances:

**❌ DELETE:**

```java
@PreAuthorize("hasRole('FARMER')")
@PreAuthorize("hasRole('WHOLESALER')")
@PreAuthorize("hasRole('RETAILER')")
@PreAuthorize("hasRole('SHOP')")
@PreAuthorize("hasAnyRole('FARMER', 'WHOLESALER', 'RETAILER', 'SHOP')")
```

**✅ REPLACE WITH:**

```java
@PreAuthorize("hasRole('SELLER')")
```

### 6. Delete Old Service Layer Logic

Remove any seller-type-specific service classes:

```java
// ❌ DELETE
FarmerService.java
WholesalerService.java
RetailerService.java
ShopService.java
```

**Replace with:**

```java
// ✅ UNIFIED SERVICE
SellerService.java  // Handles all seller types
```

---

## 🔄 CODE TO UPDATE

### 1. Update Security Configuration

**OLD:**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    http.authorizeHttpRequests()
        .requestMatchers("/api/v1/farmer/**").hasRole("FARMER")
        .requestMatchers("/api/v1/wholesale/**").hasRole("WHOLESALER")
        .requestMatchers("/api/v1/retail/**").hasRole("RETAILER")
        .requestMatchers("/api/v1/shop/**").hasRole("SHOP")
        ...
}
```

**NEW:**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    http.authorizeHttpRequests()
        .requestMatchers("/api/v1/seller/**").hasRole("SELLER")
        .requestMatchers("/api/v1/dashboard/seller/**").hasRole("SELLER")
        ...
}
```

### 2. Update User Role Enum

**File:** `com.eshop.app.enums.UserRole.java`

**Verify logic matches:**

```java
package com.eshop.app.enums;

public enum UserRole {
    ADMIN,
    CUSTOMER,
    SELLER,
    DELIVERY_AGENT;
}
```

_(User confirmed this already exists. Ensure no other legacy roles like FARMER/RETAILER exist in this enum.)_

### 3. Update Database Schema

#### A. Update SellerType Column

**If using enum in PostgreSQL:**

```sql
-- Drop old enum
DROP TYPE IF EXISTS seller_type CASCADE;

-- Create new enum
CREATE TYPE seller_type AS ENUM (
    'INDIVIDUAL',
    'BUSINESS',
    'FARMER',
    'WHOLESALER',
    'RETAILER'
);
```

**If using VARCHAR with CHECK constraint:**

```sql
ALTER TABLE seller_profiles
DROP CONSTRAINT IF EXISTS chk_seller_type;

ALTER TABLE seller_profiles
ADD CONSTRAINT chk_seller_type CHECK (
    seller_type IN ('INDIVIDUAL', 'BUSINESS', 'FARMER', 'WHOLESALER', 'RETAILER')
);
```

#### B. Ensure seller_profiles Table Exists

**Create if not exists:**

```sql
CREATE TABLE IF NOT EXISTS seller_profiles (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')
    ),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_status ON seller_profiles(status);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_seller_type ON seller_profiles(seller_type);
```

### 4. Update Existing Dashboard Endpoint

**File:** `DashboardController.java` or `SellerDashboardController.java`

**Update:**

```java
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")  // ✅ Check single SELLER role
    public ResponseEntity<SellerDashboardResponse> getSellerDashboard(Authentication auth) {
        Long userId = extractUserId(auth);

        // ✅ Check if seller profile exists
        if (!sellerService.hasProfile(userId)) {
            return ResponseEntity.status(400)
                .body(new ErrorResponse(
                    "User is not a seller",
                    "Please complete seller onboarding first"
                ));
        }

        SellerProfile profile = sellerService.getProfile(userId);
        SellerDashboardResponse dashboard = dashboardService.getDashboard(profile);

        return ResponseEntity.ok(dashboard);
    }
}
```

**Key change:** Check for profile existence in database, not just role.

---

## ➕ CODE TO ADD

### 1. Create SellerProfile Entity

**File:** `SellerProfile.java`

```java
@Entity
@Table(name = "seller_profiles")
public class SellerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "seller_type", nullable = false, length = 20)
    private SellerType sellerType;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "business_name", length = 200)
    private String businessName;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SellerStatus status = SellerStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Getters and setters
}
```

### 2. Create SellerStatus Enum

```java
public enum SellerStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED
}
```

### 3. Create Repository

**File:** `SellerProfileRepository.java`

```java
@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {

    Optional<SellerProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT COUNT(sp) FROM SellerProfile sp WHERE sp.sellerType = :type")
    long countBySellerType(@Param("type") SellerType type);
}
```

### 4. Create DTOs

**File:** `SellerRegisterRequest.java`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerRegisterRequest {

    @NotNull(message = "Seller type is required")
    private SellerType sellerType;

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 100)
    private String displayName;

    @Size(min = 2, max = 200)
    private String businessName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number")
    private String phone;

    @Size(min = 5, max = 50)
    private String taxId;

    @Size(max = 1000)
    private String description;

    @AssertTrue(message = "Terms must be accepted")
    private boolean acceptedTerms;
}
```

**File:** `SellerProfileResponse.java`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileResponse {
    private UUID id;
    private Long userId;
    private SellerType sellerType;
    private String displayName;
    private String businessName;
    private String email;
    private String phone;
    private String taxId;
    private String description;
    private SellerStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

**File:** `SellerProfileUpdateRequest.java`

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileUpdateRequest {

    @NotNull(message = "Seller type is required")
    private SellerType sellerType;

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 100)
    private String displayName;

    @Size(min = 2, max = 200)
    private String businessName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number")
    private String phone;

    @Size(min = 5, max = 50)
    private String taxId;

    @Size(max = 1000)
    private String description;
}
```

### 5. Create Service Layer

**File:** `SellerService.java`

```java
@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerProfileRepository repository;

    @Transactional
    public SellerProfileResponse registerSeller(Long userId, SellerRegisterRequest request) {
        // Check if profile already exists
        if (repository.existsByUserId(userId)) {
            throw new BadRequestException("User already has a seller profile");
        }

        // Validate terms acceptance
        if (!request.isAcceptedTerms()) {
            throw new BadRequestException("Terms must be accepted");
        }

        // Create profile
        SellerProfile profile = new SellerProfile();
        profile.setUserId(userId);
        profile.setSellerType(request.getSellerType());
        profile.setDisplayName(request.getDisplayName());
        profile.setBusinessName(request.getBusinessName());
        profile.setEmail(request.getEmail());
        profile.setPhone(request.getPhone());
        profile.setTaxId(request.getTaxId());
        profile.setDescription(request.getDescription());
        profile.setStatus(SellerStatus.ACTIVE);

        SellerProfile saved = repository.save(profile);
        return toResponse(saved);
    }

    public SellerProfileResponse getSellerProfile(Long userId) {
        SellerProfile profile = repository.findByUserId(userId)
            .orElseThrow(() -> new NotFoundException("Seller profile not found"));
        return toResponse(profile);
    }

    public boolean hasProfile(Long userId) {
        return repository.existsByUserId(userId);
    }

    @Transactional
    public SellerProfileResponse updateSellerProfile(Long userId, SellerProfileUpdateRequest request) {
        SellerProfile profile = repository.findByUserId(userId)
            .orElseThrow(() -> new NotFoundException("Seller profile not found"));

        profile.setSellerType(request.getSellerType());
        profile.setDisplayName(request.getDisplayName());
        profile.setBusinessName(request.getBusinessName());
        profile.setEmail(request.getEmail());
        profile.setPhone(request.getPhone());
        profile.setTaxId(request.getTaxId());
        profile.setDescription(request.getDescription());

        SellerProfile updated = repository.save(profile);
        return toResponse(updated);
    }

    private SellerProfileResponse toResponse(SellerProfile profile) {
        return new SellerProfileResponse(
            profile.getId(),
            profile.getUserId(),
            profile.getSellerType(),
            profile.getDisplayName(),
            profile.getBusinessName(),
            profile.getEmail(),
            profile.getPhone(),
            profile.getTaxId(),
            profile.getDescription(),
            profile.getStatus(),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }
}
```

### 6. Create Controller

**File:** `SellerController.java`

```java
@RestController
@RequestMapping("/api/v1/sellers")
@RequiredArgsConstructor
public class SellerController {

    private final SellerService sellerService;

    @PostMapping("/register")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileResponse> registerSeller(
            @Valid @RequestBody SellerRegisterRequest request,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        SellerProfileResponse response = sellerService.registerSeller(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileResponse> getProfile(Authentication authentication) {
        Long userId = extractUserId(authentication);
        SellerProfileResponse response = sellerService.getSellerProfile(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileResponse> updateProfile(
            @Valid @RequestBody SellerProfileUpdateRequest request,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        SellerProfileResponse response = sellerService.updateSellerProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    private Long extractUserId(Authentication authentication) {
        // Extract userId from JWT claims or SecurityContext
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaim("userId");
        }
        throw new UnauthorizedException("Invalid authentication");
    }
}
```

---

## 🗄️ DATABASE MIGRATION SCRIPT

**File:** `V2__unified_seller_architecture.sql`

```sql
-- Step 1: Create Enums (PostgreSQL)
-- Note: UserRole and SellerBusinessType already exist in Java, ensure DB matches.

CREATE TYPE seller_identity_type AS ENUM ('INDIVIDUAL', 'BUSINESS');
-- If seller_business_type doesn't exist yet:
CREATE TYPE seller_business_type AS ENUM ('FARMER', 'WHOLESALER', 'RETAILER');

-- Step 2: Create seller_profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL UNIQUE,
    identity_type VARCHAR(20) NOT NULL CHECK (identity_type IN ('INDIVIDUAL', 'BUSINESS')),
    business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('FARMER', 'WHOLESALER', 'RETAILER')),
    -- ... rest of columns


-- Step 2: Migrate existing data
-- Map old values to new values
UPDATE seller_profiles
SET seller_type = CASE
    WHEN seller_type::text = 'RETAIL' THEN 'RETAILER'::seller_type
    WHEN seller_type::text = 'SHOP' THEN 'BUSINESS'::seller_type
    ELSE seller_type::text::seller_type
END;

-- Step 3: Drop old enum
DROP TYPE seller_type_old;

-- Step 4: Create seller_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS seller_profiles (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')
    ),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_status ON seller_profiles(status);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_seller_type ON seller_profiles(seller_type);

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seller_profile_updated_at
    BEFORE UPDATE ON seller_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔍 SEARCH & REPLACE CHECKLIST

Use your IDE's global search to find and update:

### 1. Role References

```bash
# Search for
"ROLE_FARMER"
"ROLE_WHOLESALER"
"ROLE_RETAILER"
"ROLE_SHOP"
hasRole('FARMER')
hasRole('WHOLESALER')
hasRole('RETAILER')
hasRole('SHOP')

# Replace with
"ROLE_SELLER"
hasRole('SELLER')
```

### 2. SellerType Values

```bash
# Search for
SellerType.RETAIL
SellerType.SHOP
"RETAIL"
"SHOP"

# Replace with
SellerType.RETAILER
SellerType.BUSINESS
"RETAILER"
"BUSINESS"
```

### 3. Endpoint Paths

```bash
# Search for
"/api/v1/farmer"
"/api/v1/wholesale"
"/api/v1/retail"
"/api/v1/shop"

# Replace with
"/api/v1/seller"
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests to Update

- [ ] Update role checks in security tests
- [ ] Update SellerType enum tests
- [ ] Add tests for new seller endpoints
- [ ] Update dashboard endpoint tests

### Integration Tests

- [ ] Test POST /api/v1/sellers/register
- [ ] Test GET /api/v1/sellers/profile
- [ ] Test PUT /api/v1/sellers/profile
- [ ] Test GET /api/v1/dashboard/seller with and without profile
- [ ] Test authorization with SELLER role
- [ ] Test all 5 seller types (INDIVIDUAL, BUSINESS, FARMER, WHOLESALER, RETAILER)

### Database Tests

- [ ] Verify seller_profiles table creation
- [ ] Verify unique constraint on user_id
- [ ] Verify CHECK constraints on seller_type
- [ ] Test cascade delete on user deletion

---

## 📋 IMPLEMENTATION STEPS

### Phase 1: Preparation (1 day)

1. ✅ Review this document
2. ✅ Backup database
3. ✅ Create feature branch
4. ✅ Run existing tests to establish baseline

### Phase 2: Database (1 day)

1. ✅ Create migration script
2. ✅ Test migration on dev database
3. ✅ Verify data integrity after migration
4. ✅ Update entity classes

### Phase 3: Code Updates (2-3 days)

1. ✅ Update SellerType enum
2. ✅ Create SellerProfile entity
3. ✅ Create DTOs (Request/Response)
4. ✅ Create Repository
5. ✅ Create Service layer
6. ✅ Create Controller endpoints
7. ✅ Update security configuration
8. ✅ Update dashboard endpoint

### Phase 4: Cleanup (1 day)

1. ✅ Remove old role checks
2. ✅ Delete old controllers
3. ✅ Remove old service classes
4. ✅ Clean up unused imports

### 7. ✅ Seller & Delivery Agent Onboarding (Entity-Based)

**Refactored Logic:** Do not use meaningful separate "Request" tables. The _Profile itself_ represents the request when status is PENDING.

#### A. Updates to SellerProfile

- **New Columns**:
  - `identity_type` (ENUM: INDIVIDUAL, BUSINESS)
  - `business_type` (ENUM: FARMER, WHOLESALER, RETAILER)
- **Status Enum**: Update `SellerStatus` to include `PENDING`, `REJECTED`.
- **Logic**:
  - `POST /api/v1/sellers/register` -> Accepts both types. Creates profile with `PENDING`.
  - User remains `CUSTOMER` role until approved.

#### B. New Entity: DeliveryAgentProfile (New)

- **Table**: `delivery_agent_profiles`
  - `id` (UUID)
  - `user_id` (BIGINT, Unique)
  - `vehicle_type` (VARCHAR)
  - `license_number` (VARCHAR)
  - `status` (ENUM: PENDING, ACTIVE, REJECTED)
  - `current_latitude`, `current_longitude` (Double, nullable)
  - `is_online` (Boolean)
- **Controller**: `DeliveryAgentController`
  - `POST /register`: Create profile (PENDING).
  - `GET /profile`: Get own profile.

#### C. Admin Approval Workflow

- **Controller**: `AdminApprovalController`
- **Endpoints**:
  - `GET /api/v1/admin/approvals/pending`: List all PENDING profiles (Sellers + Agents).
  - `POST /api/v1/admin/approvals/{type}/{id}/approve`:
    1. Find Profile.
    2. Set Status = `ACTIVE`.
    3. **Keycloak**: Assign Role (`SELLER` or `DELIVERY_AGENT`).
  - `POST /api/v1/admin/approvals/{type}/{id}/reject`: Set Status = `REJECTED`.

### Phase 5: Testing (2 days)

1. ✅ Update unit tests
2. ✅ Update integration tests
3. ✅ Manual testing with frontend
4. ✅ Test all seller types

### Phase 6: Deployment (1 day)

1. ✅ Deploy to staging
2. ✅ Run smoke tests
3. ✅ Deploy to production
4. ✅ Monitor for errors

---

## 🚨 BREAKING CHANGES

### API Changes

- ❌ **REMOVED:** `/api/v1/farmer`, `/api/v1/wholesale`, `/api/v1/retail`, `/api/v1/shop` endpoints
- ✅ **ADDED:** `/api/v1/sellers/register`, `/api/v1/sellers/profile` endpoints
- ⚠️ **CHANGED:** `/api/v1/dashboard/seller` now checks for profile existence

### Role Changes

- ❌ **REMOVED:** `ROLE_FARMER`, `ROLE_WHOLESALER`, `ROLE_RETAILER`, `ROLE_SHOP`
- ✅ **UNIFIED:** All use `ROLE_SELLER`

### Data Changes

- ⚠️ **UPDATED:** SellerType values: `RETAIL` → `RETAILER`, `SHOP` → `BUSINESS`
- ✅ **ADDED:** New seller types: `INDIVIDUAL`, `BUSINESS`

---

## 📚 RELATED DOCUMENTATION

- [Frontend Implementation Status](./IMPLEMENTATION_STATUS.md)
- [Architecture Update Guide](./ARCHITECTURE_UPDATE.md)
- [Backend Quick Start](./docs/BACKEND_QUICK_START.md)
- [Seller Onboarding Implementation](./docs/SELLER_ONBOARDING_IMPLEMENTATION.md)

---

## ❓ FAQ

**Q: Do I need to migrate existing sellers?**  
A: Yes, if you have existing users with old roles (FARMER, WHOLESALER, RETAILER, SHOP), you need to:

1. Assign them ROLE_SELLER in Keycloak
2. Create seller_profiles records for them
3. Map their old type to new type (RETAIL→RETAILER, SHOP→BUSINESS)

**Q: What happens to users without seller profiles?**  
A: They'll see an onboarding prompt when visiting `/seller` dashboard. Backend returns 400 error with message "User is not a seller".

**Q: Can sellers change their type?**  
A: Yes, through the profile update endpoint. The frontend allows this in `/seller/profile`.

**Q: Do I need to update Keycloak?**  
A: Yes, remove old seller roles and ensure only ROLE_SELLER exists.

**Q: What about existing products/orders?**  
A: They should work unchanged. Just ensure seller_id relationships are maintained.

---

**Need Help?** Check the detailed implementation guides in the `docs/` folder.
