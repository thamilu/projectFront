# Seller Onboarding Implementation

## Overview

Complete seller onboarding system allowing customers to become sellers and start earning.

## Frontend Implementation ✅

### Files Created

1. **Types & Schemas**
   - `features/seller/types.ts` - TypeScript interfaces for seller data
   - `features/seller/schemas.ts` - Zod validation schemas

2. **API Client**
   - `features/seller/api.ts` - API methods for seller operations

3. **Components**
   - `features/seller/components/SellerOnboardingForm.tsx` - Registration form with validation

4. **Pages**
   - `app/seller/onboard/page.tsx` - Onboarding landing page
   - `app/seller/page.tsx` - Updated to detect and redirect to onboarding

## Backend Requirements (To Implement)

### 1. Seller Registration Endpoint

**Endpoint**: `POST /api/v1/sellers/register`

**Request Body**:

```json
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
```

**Response** (201 Created):

```json
{
  "success": true,
  "sellerId": "uuid-or-id",
  "profile": {
    "id": "uuid",
    "userId": "user-id",
    "sellerType": "INDIVIDUAL",
    "displayName": "My Store",
    "status": "ACTIVE",
    ...
  },
  "message": "Seller profile created successfully"
}
```

### 2. Get Seller Profile Endpoint

**Endpoint**: `GET /api/v1/sellers/profile`

**Response** (200 OK):

```json
{
  "id": "uuid",
  "userId": "user-id",
  "sellerType": "INDIVIDUAL",
  "displayName": "My Store",
  "status": "ACTIVE",
  ...
}
```

**Response** (404 Not Found) if no profile exists.

### 3. Update Seller Profile Endpoint

**Endpoint**: `PUT /api/v1/sellers/profile`

## Backend Implementation Steps

### Step 1: Create SellerProfile Entity (if not exists)

```java
@Entity
@Table(name = "seller_profiles")
public class SellerProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId; // or UUID depending on your User entity

    @Enumerated(EnumType.STRING)
    @Column(name = "seller_type", nullable = false)
    private SellerType sellerType;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "business_name", length = 200)
    private String businessName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SellerStatus status = SellerStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
}

public enum SellerType {
    INDIVIDUAL,
    BUSINESS,
    FARMER,
    WHOLESALER,
    RETAILER,
    MANUFACTURER,
    DISTRIBUTOR,
    BRAND_OWNER
}

public enum SellerStatus {
    PENDING,
    ACTIVE,
    SUSPENDED,
    INACTIVE
}
```

### Step 2: Create DTO Classes

```java
@Data
public class SellerRegistrationRequest {
    @NotNull
    private SellerType sellerType;

    @NotBlank
    @Size(min = 2, max = 100)
    private String displayName;

    @Size(min = 2, max = 200)
    private String businessName;

    @NotBlank
    @Email
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number")
    private String phone;

    @Size(min = 5, max = 50)
    private String taxId;

    @Size(max = 1000)
    private String description;

    @AssertTrue(message = "Terms must be accepted")
    private Boolean acceptedTerms;
}

@Data
public class SellerRegistrationResponse {
    private boolean success;
    private String sellerId;
    private SellerProfileDTO profile;
    private String message;
}
```

### Step 3: Create Repository

```java
@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {
    Optional<SellerProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
```

### Step 4: Create Service

```java
@Service
@RequiredArgsConstructor
public class SellerService {
    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public SellerRegistrationResponse registerSeller(
            SellerRegistrationRequest request,
            Long userId
    ) {
        // Check if seller profile already exists
        if (sellerProfileRepository.existsByUserId(userId)) {
            throw new IllegalStateException("Seller profile already exists");
        }

        // Verify user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create seller profile
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

        SellerProfile saved = sellerProfileRepository.save(profile);

        return SellerRegistrationResponse.builder()
                .success(true)
                .sellerId(saved.getId().toString())
                .profile(mapToDTO(saved))
                .message("Seller profile created successfully")
                .build();
    }

    public Optional<SellerProfile> getSellerProfile(Long userId) {
        return sellerProfileRepository.findByUserId(userId);
    }

    @Transactional
    public SellerProfile updateSellerProfile(
            Long userId,
            SellerRegistrationRequest request
    ) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Seller profile not found"));

        // Update fields
        profile.setDisplayName(request.getDisplayName());
        profile.setBusinessName(request.getBusinessName());
        profile.setEmail(request.getEmail());
        profile.setPhone(request.getPhone());
        profile.setTaxId(request.getTaxId());
        profile.setDescription(request.getDescription());

        return sellerProfileRepository.save(profile);
    }

    private SellerProfileDTO mapToDTO(SellerProfile profile) {
        // Map entity to DTO
        return SellerProfileDTO.builder()
                .id(profile.getId().toString())
                .userId(profile.getUserId().toString())
                .sellerType(profile.getSellerType())
                .displayName(profile.getDisplayName())
                .businessName(profile.getBusinessName())
                .email(profile.getEmail())
                .phone(profile.getPhone())
                .taxId(profile.getTaxId())
                .description(profile.getDescription())
                .status(profile.getStatus())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
```

### Step 5: Create Controller

```java
@RestController
@RequestMapping("/api/v1/sellers")
@RequiredArgsConstructor
@Slf4j
public class SellerController {
    private final SellerService sellerService;

    @PostMapping("/register")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerRegistrationResponse> registerSeller(
            @Valid @RequestBody SellerRegistrationRequest request,
            @AuthenticationPrincipal KeycloakPrincipal principal
    ) {
        log.info("Seller registration request from user: {}", principal.getName());

        Long userId = extractUserId(principal);
        SellerRegistrationResponse response = sellerService.registerSeller(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileDTO> getSellerProfile(
            @AuthenticationPrincipal KeycloakPrincipal principal
    ) {
        Long userId = extractUserId(principal);

        return sellerService.getSellerProfile(userId)
                .map(profile -> ResponseEntity.ok(mapToDTO(profile)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileDTO> updateSellerProfile(
            @Valid @RequestBody SellerRegistrationRequest request,
            @AuthenticationPrincipal KeycloakPrincipal principal
    ) {
        Long userId = extractUserId(principal);
        SellerProfile updated = sellerService.updateSellerProfile(userId, request);

        return ResponseEntity.ok(mapToDTO(updated));
    }

    private Long extractUserId(KeycloakPrincipal principal) {
        // Extract user ID from JWT token
        Map<String, Object> claims = principal.getKeycloakSecurityContext()
                .getToken().getOtherClaims();
        return Long.valueOf(claims.get("sub").toString());
    }
}
```

### Step 6: Create Database Migration

```sql
-- V1__create_seller_profiles.sql
CREATE TABLE seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL UNIQUE,
    seller_type VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(200),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    tax_id VARCHAR(50),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_seller_type CHECK (seller_type IN ('INDIVIDUAL', 'BUSINESS', 'FARMER', 'WHOLESALER', 'RETAILER', 'MANUFACTURER', 'DISTRIBUTOR', 'BRAND_OWNER')),
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'))
);

CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_status ON seller_profiles(status);
```

## Testing

1. **Manual Test**:

   ```bash
   # 1. Visit http://localhost:3000/seller (with SELLER role)
   # 2. Click "Complete Seller Profile"
   # 3. Fill out the onboarding form
   # 4. Submit and verify redirect to dashboard
   ```

2. **API Test**:
   ```bash
   curl -X POST http://localhost:8082/api/v1/sellers/register \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "sellerType": "INDIVIDUAL",
       "displayName": "My Store",
       "email": "seller@example.com",
       "acceptedTerms": true
     }'
   ```

## Next Steps

1. ✅ Frontend onboarding flow implemented
2. ⏳ Backend API endpoints (follow guide above)
3. ⏳ Product creation UI
4. ⏳ Payment integration
5. ⏳ Seller dashboard analytics

## Notes

- All seller operations require `ROLE_SELLER` in JWT
- Seller profile is separate from user authentication
- Status field allows for approval workflows
- Frontend validates and backend re-validates all inputs
