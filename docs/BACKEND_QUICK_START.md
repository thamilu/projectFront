# Backend Quick Start - Seller Onboarding

**For Backend Developers: 3 Endpoints to Implement**

---

## 🎯 What You Need to Build

The frontend is **100% complete** and waiting for these 3 REST endpoints:

### 1️⃣ POST /api/v1/sellers/register

- **Purpose:** Create seller profile for authenticated user
- **Auth:** Bearer JWT with ROLE_SELLER
- **Input:** SellerRegisterRequest (see below)
- **Output:** SellerProfileResponse (201 Created)
- **Errors:** 400 if profile already exists

### 2️⃣ GET /api/v1/sellers/profile

- **Purpose:** Get seller profile for current user
- **Auth:** Bearer JWT with ROLE_SELLER
- **Input:** None (userId from JWT)
- **Output:** SellerProfileResponse (200 OK)
- **Errors:** 404 if profile doesn't exist

### 3️⃣ PUT /api/v1/sellers/profile

- **Purpose:** Update seller profile for current user
- **Auth:** Bearer JWT with ROLE_SELLER
- **Input:** SellerProfileUpdateRequest
- **Output:** SellerProfileResponse (200 OK)
- **Errors:** 404 if profile doesn't exist

---

## 📦 DTO Definitions

### SellerRegisterRequest

```java
public class SellerRegisterRequest {
    @NotNull
    private SellerType sellerType; // INDIVIDUAL, BUSINESS, FARMER, WHOLESALER, RETAILER

    @NotBlank
    @Size(min = 2, max = 100)
    private String displayName;

    @Size(min = 2, max = 200)
    private String businessName; // Optional

    @NotBlank
    @Email
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
    private String phone; // Optional

    @Size(min = 5, max = 50)
    private String taxId; // Optional

    @Size(max = 1000)
    private String description; // Optional

    @AssertTrue
    private boolean acceptedTerms;
}
```

### SellerProfileUpdateRequest

```java
public class SellerProfileUpdateRequest {
    @NotNull
    private SellerType sellerType;

    @NotBlank
    @Size(min = 2, max = 100)
    private String displayName;

    @Size(min = 2, max = 200)
    private String businessName; // Optional

    @NotBlank
    @Email
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
    private String phone; // Optional

    @Size(min = 5, max = 50)
    private String taxId; // Optional

    @Size(max = 1000)
    private String description; // Optional

    // Note: No acceptedTerms field for updates
}
```

### SellerProfileResponse

```java
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
    private SellerStatus status; // ACTIVE, INACTIVE, SUSPENDED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

## 🗄️ Database Migration

```sql
-- Create enum types (if not using JPA @Enumerated)
CREATE TYPE seller_type AS ENUM ('INDIVIDUAL', 'BUSINESS', 'FARMER', 'WHOLESALER', 'RETAILER');
CREATE TYPE seller_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- Create seller_profiles table
CREATE TABLE seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL UNIQUE,
    seller_type VARCHAR(20) NOT NULL CHECK (seller_type IN ('INDIVIDUAL', 'BUSINESS', 'FARMER', 'WHOLESALER', 'RETAILER')),
    display_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(200),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tax_id VARCHAR(50),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_status ON seller_profiles(status);
CREATE INDEX idx_seller_profiles_seller_type ON seller_profiles(seller_type);

-- Create updated_at trigger
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

## 🔧 Service Layer Logic

### SellerService.java (pseudo-code)

```java
@Service
public class SellerService {

    @Autowired
    private SellerRepository sellerRepository;

    @Transactional
    public SellerProfileResponse registerSeller(Long userId, SellerRegisterRequest request) {
        // Check if seller already exists
        if (sellerRepository.existsByUserId(userId)) {
            throw new SellerAlreadyExistsException("User already has a seller profile");
        }

        // Validate acceptedTerms
        if (!request.isAcceptedTerms()) {
            throw new IllegalArgumentException("Terms must be accepted");
        }

        // Create new seller profile
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

        SellerProfile saved = sellerRepository.save(profile);
        return toResponse(saved);
    }

    public SellerProfileResponse getSellerProfile(Long userId) {
        SellerProfile profile = sellerRepository.findByUserId(userId)
            .orElseThrow(() -> new SellerProfileNotFoundException("Seller profile not found"));
        return toResponse(profile);
    }

    @Transactional
    public SellerProfileResponse updateSellerProfile(Long userId, SellerProfileUpdateRequest request) {
        SellerProfile profile = sellerRepository.findByUserId(userId)
            .orElseThrow(() -> new SellerProfileNotFoundException("Seller profile not found"));

        profile.setSellerType(request.getSellerType());
        profile.setDisplayName(request.getDisplayName());
        profile.setBusinessName(request.getBusinessName());
        profile.setEmail(request.getEmail());
        profile.setPhone(request.getPhone());
        profile.setTaxId(request.getTaxId());
        profile.setDescription(request.getDescription());

        SellerProfile updated = sellerRepository.save(profile);
        return toResponse(updated);
    }

    private SellerProfileResponse toResponse(SellerProfile profile) {
        // Map entity to DTO
    }
}
```

---

## 🎮 Controller Layer

### SellerController.java

```java
@RestController
@RequestMapping("/api/v1/sellers")
@PreAuthorize("hasRole('SELLER')")
public class SellerController {

    @Autowired
    private SellerService sellerService;

    @PostMapping("/register")
    public ResponseEntity<SellerProfileResponse> registerSeller(
            @Valid @RequestBody SellerRegisterRequest request,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        SellerProfileResponse response = sellerService.registerSeller(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<SellerProfileResponse> getProfile(Authentication authentication) {
        Long userId = extractUserId(authentication);
        SellerProfileResponse response = sellerService.getSellerProfile(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<SellerProfileResponse> updateProfile(
            @Valid @RequestBody SellerProfileUpdateRequest request,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        SellerProfileResponse response = sellerService.updateSellerProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    private Long extractUserId(Authentication authentication) {
        // Extract userId from JWT claims
        // Example: ((Jwt) authentication.getPrincipal()).getClaim("userId")
    }
}
```

---

## 🧪 Test with cURL

### Register Seller

```bash
curl -X POST http://localhost:8082/api/v1/sellers/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sellerType": "INDIVIDUAL",
    "displayName": "Test Store",
    "email": "test@example.com",
    "phone": "+1234567890",
    "description": "My test store",
    "acceptedTerms": true
  }'
```

### Get Profile

```bash
curl -X GET http://localhost:8082/api/v1/sellers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:8082/api/v1/sellers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sellerType": "BUSINESS",
    "displayName": "Updated Store",
    "businessName": "Updated Business LLC",
    "email": "updated@example.com",
    "phone": "+1987654321",
    "taxId": "TAX123",
    "description": "Updated description"
  }'
```

---

## 🔍 Expected Frontend Behavior

### When Backend is Ready:

1. **User with ROLE_SELLER visits `/seller`**
   - Backend returns 400 with "User is not a seller" error
   - Frontend detects this and shows onboarding prompt
   - User clicks "Get Started" → redirects to `/seller/onboard`

2. **User fills onboarding form**
   - Frontend validates with Zod
   - Calls POST /api/v1/sellers/register
   - Backend creates seller_profiles row
   - Frontend shows success toast and redirects to `/seller`

3. **User visits `/seller` again**
   - GET /api/v1/dashboard/seller now returns 200 (profile exists)
   - Dashboard loads successfully

4. **User clicks profile in dropdown**
   - Routes to `/seller/profile` (not `/settings/profile`)
   - Calls GET /api/v1/sellers/profile
   - Shows profile form pre-filled with data

5. **User edits and saves profile**
   - Frontend validates with Zod
   - Calls PUT /api/v1/sellers/profile
   - Backend updates seller_profiles row
   - Frontend shows success toast

---

## ❗ Critical Requirements

### Error Responses Must Follow RFC7807

All errors should return JSON with this structure:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "User already has a seller profile",
  "instance": "/api/v1/sellers/register"
}
```

Frontend expects these fields:

- `detail` - User-friendly error message (shown in toast)
- `title` - Error type
- `status` - HTTP status code

### Security Requirements

1. **Extract userId from JWT** - Don't trust userId from request body
2. **Validate ROLE_SELLER** - Use @PreAuthorize or SecurityContext
3. **Unique Constraint** - user_id must be unique (one profile per user)
4. **Foreign Key** - user_id must reference valid users table row

### Database Constraints

- `user_id` - UNIQUE, NOT NULL, FOREIGN KEY to users(id)
- `seller_type` - CHECK constraint or enum
- `display_name` - NOT NULL, MIN 2 chars
- `email` - NOT NULL, valid email format
- `status` - DEFAULT 'ACTIVE'

---

## 📚 More Details

For complete implementation guide with entity code, repository interfaces, and exception handling, see:

- [Full Backend Implementation Guide](./SELLER_ONBOARDING_IMPLEMENTATION.md)

---

## ✅ When You're Done

Test the full flow:

1. Login with ROLE_SELLER
2. Visit http://localhost:3000/seller
3. Should see onboarding prompt
4. Complete registration form
5. Verify redirect to dashboard
6. Visit profile page
7. Edit and save changes

Frontend is ready to test immediately when your endpoints are live! 🚀
