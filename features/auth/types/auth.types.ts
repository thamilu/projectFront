// src/types/auth.types.ts
export interface LoginRequest {
  username: string;
  password: string;
  // Optional redirect target for credential-based login flows
  redirectTo?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token?: string;
  session_state?: string;
  scope: string;
}

export interface UserInfo {
  sub: string;
  email_verified?: boolean;
  name?: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  email: string;
  roles?: string[];

  // Legacy / application-specific fields (added for compatibility)
  username?: string;
  firstName?: string;
  lastName?: string;
  shopName?: string;
  // Single role (legacy) — keep optional for older payloads
  role?: string;
  picture?: string;
  phone?: string;
  address?: string;

  // Demographics & Address
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gender?: string;
  dateOfBirth?: string;

  // KYC Fields
  aadhar?: string;
  pan?: string;
  kycStatus?: string;

  // Allow extra provider-specific/custom claims
  [key: string]: unknown;
}

export interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginUrlResponse {
  authorizationUrl: string;
  state: string;
  message: string;
}
