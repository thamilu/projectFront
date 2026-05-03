# 🔧 Spring Boot Backend Configuration Verification

## ✅ Test Frontend → Backend Communication

### **1. Frontend Test Page Created**

Visit: **http://localhost:3000/test-backend**

This page will:
- ✅ Show authentication status
- ✅ Test public endpoints (no auth)
- ✅ Test protected endpoints (with JWT)
- ✅ Test admin endpoints (role-based)
- ✅ Display responses in real-time

---

## 🔍 Backend Configuration Checklist

### **Step 1: Verify Spring Security JWT Configuration**

Check your `SecurityConfig.java` (or similar):

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/products/featured", "/api/public/**").permitAll()
                
                // Protected endpoints
                .requestMatchers("/api/products/**").authenticated()
                
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()); // Disable for API

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        
        // ✅ CRITICAL: Extract roles from Keycloak realm_access.roles
        grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        
        return jwtAuthenticationConverter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

---

### **Step 2: Verify application.properties**

```properties
# OAuth2 Resource Server (JWT validation)
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/eshop
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8080/realms/eshop/protocol/openid-connect/certs

# ✅ IMPORTANT: Backend should NOT handle login/logout
# It only validates JWT tokens from Keycloak

# Server port
server.port=8082

# CORS (if not configured in SecurityConfig)
# spring.web.cors.allowed-origins=http://localhost:3000
# spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
# spring.web.cors.allow-credentials=true

# Enable debug logging (optional, for testing)
logging.level.org.springframework.security=DEBUG
logging.level.org.springframework.web=DEBUG
```

---

### **Step 3: Add Custom JWT Converter (Recommended)**

For better role extraction from Keycloak:

```java
@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        // Extract realm roles from Keycloak JWT
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        
        // Extract username from preferred_username or sub
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) {
            username = jwt.getSubject();
        }
        
        return new JwtAuthenticationToken(jwt, authorities, username);
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        
        // Extract realm roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.get("roles") != null) {
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            
            for (String role : roles) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
            }
        }
        
        // Extract resource/client roles (optional)
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get("eshop-client");
            if (clientAccess != null && clientAccess.get("roles") != null) {
                @SuppressWarnings("unchecked")
                List<String> clientRoles = (List<String>) clientAccess.get("roles");
                
                for (String role : clientRoles) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                }
            }
        }
        
        return authorities;
    }
}
```

Then use it in SecurityConfig:

```java
@Autowired
private KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter;

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // ... other config ...
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt
                .jwtAuthenticationConverter(keycloakJwtAuthenticationConverter)
            )
        );
    
    return http.build();
}
```

---

### **Step 4: Add Role-Based Endpoints (Testing)**

Create test controllers:

```java
@RestController
@RequestMapping("/api")
public class TestController {

    // Public endpoint
    @GetMapping("/public/health")
    public ResponseEntity<Map<String, String>> publicHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "message", "Public endpoint accessible"
        ));
    }

    // Authenticated endpoint
    @GetMapping("/protected/info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> protectedInfo(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "user", authentication.getName(),
            "authorities", authentication.getAuthorities(),
            "message", "Authenticated endpoint accessible"
        ));
    }

    // Admin-only endpoint
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminUsers(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "user", authentication.getName(),
            "authorities", authentication.getAuthorities(),
            "message", "Admin endpoint accessible",
            "users", List.of("user1", "user2", "admin")
        ));
    }

    // Customer-only endpoint
    @GetMapping("/customer/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, Object>> customerOrders(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "user", authentication.getName(),
            "message", "Customer orders endpoint accessible"
        ));
    }
}
```

---

## 🧪 Testing Steps

### **1. Start Backend**
```bash
cd backend
./mvnw spring-boot:run
```

Verify it starts on port 8082.

### **2. Test from Frontend**

1. Visit: **http://localhost:3000/test-backend**
2. Sign in with Keycloak
3. Click test buttons
4. Watch browser console for requests
5. Watch backend terminal for logs

### **3. Expected Backend Logs (SUCCESS)**

```
Securing GET /api/products/featured
Authorized method invocation
BearerTokenAuthenticationFilter : Authenticating request
JwtAuthenticationProvider : Authenticated token
Mapped to ProductController.getFeaturedProducts()
```

### **4. Test with cURL (Manual)**

```bash
# Get access token from frontend console
ACCESS_TOKEN="your_token_here"

# Test protected endpoint
curl -X GET http://localhost:8082/api/products \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Test admin endpoint
curl -X GET http://localhost:8082/api/admin/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔍 Debugging Common Issues

### **Issue: 401 Unauthorized**

**Possible causes:**
1. JWT issuer mismatch
   - Check: `spring.security.oauth2.resourceserver.jwt.issuer-uri`
   - Must match Keycloak: `http://localhost:8080/realms/eshop`

2. JWT not being sent
   - Check browser Network tab
   - Verify `Authorization: Bearer ...` header

3. Token expired
   - Refresh page to get new token

### **Issue: 403 Forbidden**

**Possible causes:**
1. Missing role in JWT
   - Check Keycloak user role assignments
   - Verify role extraction in backend

2. Wrong role prefix
   - Backend expects `ROLE_ADMIN`
   - JWT contains `ADMIN`
   - Fix: `grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_")`

### **Issue: CORS Error**

**Fix:**
1. Add CORS configuration to SecurityConfig
2. Ensure `Access-Control-Allow-Origin: http://localhost:3000`
3. Enable credentials if using cookies

---

## ✅ Success Indicators

- [ ] Frontend test page loads
- [ ] Public endpoints return 200
- [ ] Protected endpoints return 200 with valid token
- [ ] Protected endpoints return 401 without token
- [ ] Admin endpoints return 200 for admin users
- [ ] Admin endpoints return 403 for non-admin users
- [ ] Backend logs show JWT authentication
- [ ] Roles are extracted from JWT correctly

---

## 📝 Quick Test Checklist

```bash
# 1. Backend running?
curl http://localhost:8082/actuator/health

# 2. Keycloak reachable?
curl http://localhost:8080/realms/eshop/.well-known/openid-configuration

# 3. Frontend running?
curl http://localhost:3000/api/auth/session

# 4. Frontend test page?
# Open: http://localhost:3000/test-backend
```

---

Good luck! Visit **/test-backend** to start testing! 🚀
