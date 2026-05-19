/**
 * Secure Token Storage Strategy
 * 
 * ENTERPRISE SECURITY REQUIREMENTS:
 * - Tokens stored in httpOnly cookies (backend sets)
 * - No localStorage/sessionStorage usage
 * - CSRF protection via SameSite=Strict
 * - Automatic token rotation handled by backend
 * 
 * This module only manages client-side token state for
 * optimistic UI updates and token expiry tracking.
 * 
 * @module lib/security/token-storage
 */

interface TokenMetadata {
  expiresAt: number;
  issuedAt: number;
  userId: string;
}

/**
 * In-memory token cache (not persisted)
 * Used only for:
 * 1. Checking token expiry without cookie access
 * 2. Optimistic UI state updates
 * 3. Correlation with backend auth state
 */
class SecureTokenStorage {
  private metadata: TokenMetadata | null = null;
  
  /**
   * Set token metadata (not the actual token)
   * Actual tokens MUST be in httpOnly cookies
   */
  setTokenMetadata(userId: string, expiresIn: number): void {
    const now = Date.now();
    this.metadata = {
      userId,
      expiresAt: now + expiresIn * 1000,
      issuedAt: now,
    };
  }
  
  /**
   * Check if token is likely expired
   * Note: This is optimistic - backend is source of truth
   */
  isTokenExpired(): boolean {
    if (!this.metadata) return true;
    
    // Add 60s buffer to trigger refresh before actual expiry
    const bufferMs = 60 * 1000;
    return Date.now() >= (this.metadata.expiresAt - bufferMs);
  }
  
  /**
   * Get token expiry timestamp
   */
  getExpiresAt(): number | null {
    return this.metadata?.expiresAt ?? null;
  }
  
  /**
   * Get user ID from token metadata
   */
  getUserId(): string | null {
    return this.metadata?.userId ?? null;
  }
  
  /**
   * Clear token metadata (on logout)
   */
  clearMetadata(): void {
    this.metadata = null;
  }
  
  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry(): number {
    if (!this.metadata) return 0;
    
    const remaining = this.metadata.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

/**
 * Singleton instance
 */
export const secureTokenStorage = new SecureTokenStorage();

/**
 * Legacy compatibility wrapper
 * 
 * WARNING: These methods do NOT store actual tokens.
 * They only manage metadata for UI state synchronization.
 */
export const tokenStorage = {
  /**
   * @deprecated Tokens are now in httpOnly cookies
   * This only stores metadata
   */
  setTokens(accessToken: string, _refreshToken: string): void {
    console.warn('[SECURITY] tokenStorage.setTokens called - tokens should be in httpOnly cookies');
    // Extract userId from JWT (basic decode - DO NOT validate here)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
      secureTokenStorage.setTokenMetadata(payload.sub || payload.userId, expiresIn);
    } catch (error) {
      console.error('[SECURITY] Failed to extract token metadata:', error);
    }
  },
  
  /**
   * @deprecated Tokens are in httpOnly cookies (not accessible)
   * Returns null to force cookie-based authentication
   */
  getAccessToken(): string | null {
    return null; // Force cookie-based auth
  },
  
  /**
   * @deprecated Tokens are in httpOnly cookies (not accessible)
   */
  getRefreshToken(): string | null {
    return null;
  },
  
  clearTokens(): void {
    secureTokenStorage.clearMetadata();
  },
  
  isExpired(): boolean {
    return secureTokenStorage.isTokenExpired();
  },
};

/**
 * Hook for token expiry monitoring
 * Triggers re-auth when token is about to expire
 */
export function useTokenExpiryMonitor(onExpiringSoon: () => void): void {
  if (typeof window === 'undefined') return;
  
  const checkExpiry = () => {
    const timeRemaining = secureTokenStorage.getTimeUntilExpiry();
    
    // Trigger refresh when < 5 minutes remaining
    if (timeRemaining > 0 && timeRemaining < 300) {
      onExpiringSoon();
    }
  };
  
  // Check every 30 seconds
  const interval = setInterval(checkExpiry, 30000);
  
  // Cleanup
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => clearInterval(interval));
  }
}
