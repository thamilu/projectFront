// src/services/authService.ts
import axiosInstance, { tokenStorage } from '@/lib/axios';
import { storeTokens } from '@/lib/utils/token-utils';
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserInfo,
  LoginUrlResponse,
} from '@/types/auth.types';
import { env } from '@/env';

class AuthService {
  private readonly AUTH_URL = env.apiAuthUrl;

  /**
   * Persist tokens using centralized utility
   */
  // NOTE: use the shared `storeTokens` to keep token storage logic DRY

  /**
   * Login with username and password
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    // If direct login is enabled, use the local credentials endpoint which
    // exchanges credentials server-side with Keycloak and creates a session cookie.
    if (typeof window !== 'undefined' && env.enableDirectLogin) {
      const resp = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, redirectTo: credentials.redirectTo }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Login failed');
      }

      // The credentials route sets a secure session cookie; it returns a small body.
      await resp.json();

      // Fetch current user & tokens from local API that reads session cookie
      const meResp = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meResp.ok) {
        throw new Error('Failed to fetch session after login');
      }
      const data = await meResp.json();

      // Store tokens in client-side storage as a convenience
      storeTokens(data as TokenResponse, tokenStorage);

      return data as TokenResponse;
    }

    const { data } = await axiosInstance.post<TokenResponse>(`${this.AUTH_URL}/login`, credentials);

    // Store tokens
    storeTokens(data, tokenStorage);

    return data;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<{ message: string }> {
    const { data } = await axiosInstance.post(`${this.AUTH_URL}/register`, userData);
    return data;
  }

  /**
   * Get authorization URL for OAuth2 login
   * @deprecated Use NextAuth signIn('keycloak', { callbackUrl }) instead
   * This method is kept for backward compatibility but should be migrated
   */
  async getLoginUrl(params?: {
    redirectUri?: string;
    state?: string;
    nonce?: string;
  }): Promise<LoginUrlResponse> {
    console.warn('[authService] getLoginUrl is deprecated. Use NextAuth signIn() instead.');

    // Use backend API base as canonical redirect URI unless overridden
    const uri = params?.redirectUri || `${env.apiBaseUrl}`;

    // If running in the browser, prefer the internal authorize endpoint
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams();
      if (params?.redirectUri) search.set('redirectTo', params.redirectUri);
      if (params?.state) search.set('state', params.state);
      if (params?.nonce) search.set('nonce', params.nonce);
      // Request popup-friendly authorize URL
      search.set('popup', '1');

      const resp = await fetch(`/api/auth/keycloak/authorize?${search.toString()}`);
      if (!resp.ok) throw new Error('Failed to get authorization URL');
      const data = await resp.json();

      const stateToPersist = params?.state || data.state;
      if (stateToPersist) sessionStorage.setItem('oauth_state', stateToPersist);

      return data as LoginUrlResponse;
    }

    const { data } = await axiosInstance.get<LoginUrlResponse>(`${this.AUTH_URL}/login-url`, {
      params: { redirectUri: uri, state: params?.state, nonce: params?.nonce },
    });

    if (typeof window !== 'undefined') {
      const stateToPersist = params?.state || data.state;
      if (stateToPersist) sessionStorage.setItem('oauth_state', stateToPersist);
    }

    return data;
  }

  /**
   * Handle OAuth2 callback
   */
  async handleCallback(code: string, state: string, redirectUri?: string): Promise<TokenResponse> {
    // Verify state
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }
      sessionStorage.removeItem('oauth_state');
    }

    // Use backend API base as canonical redirect URI unless overridden
    const uri = redirectUri || `${env.apiBaseUrl}`;
    const { data } = await axiosInstance.get<TokenResponse>(`${this.AUTH_URL}/callback`, {
      params: { code, redirectUri: uri },
    });

    // Store tokens
    storeTokens(data, tokenStorage);

    return data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const { data } = await axiosInstance.post<TokenResponse>(`${this.AUTH_URL}/refresh`, {
      refreshToken,
    });

    // Update tokens
    storeTokens(data, tokenStorage);

    return data;
  }

  /**
   * Get current user info
   */
  async getUserInfo(): Promise<UserInfo> {
    const { data } = await axiosInstance.get<UserInfo>(`${this.AUTH_URL}/userinfo`);
    return data;
  }

  /**
   * Get current user from JWT (faster, no server call)
   */
  async getCurrentUser(): Promise<UserInfo> {
    const { data } = await axiosInstance.get<UserInfo>(`${this.AUTH_URL}/me`);
    return data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();

    if (refreshToken) {
      try {
        await axiosInstance.post(`${this.AUTH_URL}/logout`, { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear tokens
    tokenStorage.clearTokens();
  }

  /**
   * Introspect/validate token
   */
  async introspectToken(token: string): Promise<{ active: boolean; [key: string]: unknown }> {
    const { data } = await axiosInstance.post(
      `${this.AUTH_URL}/introspect`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data as { active: boolean; [key: string]: unknown };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = tokenStorage.getAccessToken();
    return !!token && !tokenStorage.isTokenExpired();
  }

  /**
   * Get OpenID configuration
   */
  async getConfig(): Promise<unknown> {
    const { data } = await axiosInstance.get(`${this.AUTH_URL}/config`);
    return data;
  }
}

export const authService = new AuthService();
