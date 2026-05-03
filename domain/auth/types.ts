/**
 * Authentication Domain Types
 * 
 * Central type definitions for authentication domain
 * Provides type safety across the application
 */

// ============================================================================
// User Types
// ============================================================================

/**
 * User role enumeration
 * 
 * Roles:
 * - customer: Regular shoppers
 * - farmer: Product suppliers
 * - seller: Store operators
 * - delivery: Delivery personnel
 * - retail: Retail store managers
 * - wholesale: Wholesale buyers
 * - manager: Regional managers
 * - admin: System administrators
 */
export type UserRole =
  | 'customer'
  | 'farmer'
  | 'seller'
  | 'delivery'
  | 'retail'
  | 'wholesale'
  | 'manager'
  | 'admin';

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  createdAt: Date;
  lastLoginAt: Date | null;
  emailVerified: boolean;
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * Authenticated session
 * 
 * Contains user information and tokens
 * Stored in encrypted cookie
 */
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

/**
 * Token pair returned from OAuth2 token endpoint
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

// ============================================================================
// OAuth2 Types
// ============================================================================

/**
 * OAuth2 authorization parameters
 */
export interface AuthorizationParams {
  clientId: string;
  redirectUri: string;
  responseType: 'code';
  scope: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  loginHint?: string;
}

/**
 * OAuth2 token request
 */
export interface TokenRequest {
  grantType: 'authorization_code' | 'refresh_token';
  clientId: string;
  clientSecret?: string;
  code?: string;
  codeVerifier?: string;
  refreshToken?: string;
  redirectUri?: string;
}

/**
 * OAuth2 token response
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

// ============================================================================
// ID Token Claims
// ============================================================================

/**
 * Standard OpenID Connect ID token claims
 */
export interface IdTokenClaims {
  iss: string; // Issuer
  sub: string; // Subject (user ID)
  aud: string | string[]; // Audience (client ID)
  exp: number; // Expiration time
  iat: number; // Issued at
  auth_time?: number; // Authentication time
  nonce?: string; // Nonce
  acr?: string; // Authentication Context Class Reference
  amr?: string[]; // Authentication Methods References
  azp?: string; // Authorized party
  
  // Profile claims
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  updated_at?: number;
  
  // Email claims
  email?: string;
  email_verified?: boolean;
  
  // Phone claims
  phone_number?: string;
  phone_number_verified?: boolean;
  
  // Address claim
  address?: {
    formatted?: string;
    street_address?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  
  // Keycloak-specific claims
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [client: string]: {
      roles: string[];
    };
  };
}

// ============================================================================
// Authentication State
// ============================================================================

/**
 * Client-side authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

/**
 * Login state for forms
 */
export interface LoginState {
  isLoading: boolean;
  error: string | null;
  redirectTo?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Authentication error codes
 */
export type AuthErrorCode =
  | 'configuration_error'
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable'
  | 'session_expired'
  | 'state_mismatch'
  | 'nonce_mismatch'
  | 'callback_failed'
  | 'token_refresh_failed'
  | 'logout_failed';

/**
 * Authentication error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  description?: string;
  timestamp: Date;
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Permission check result
 */
export interface PermissionCheck {
  granted: boolean;
  requiredRoles: UserRole[];
  userRoles: UserRole[];
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  path: string;
  requireAuth: boolean;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}
