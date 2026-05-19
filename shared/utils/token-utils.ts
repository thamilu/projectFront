/**
 * Token Management Utilities
 * Centralizes token storage/retrieval logic to follow DRY principle
 */

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
}

/**
 * Store authentication tokens in appropriate storage
 * Consolidates the repeated 3-line pattern across the codebase
 *
 * @example
 * ```ts
 * const tokenData = { access_token: '...', refresh_token: '...', expires_in: 3600 };
 * storeTokens(tokenData, tokenStorage);
 * ```
 */
export function storeTokens(
  data: TokenData,
  storage: {
    setTokens: (accessToken: string, refreshToken?: string) => void;
    setTokenExpiry?: (expiresIn: number) => void;
  }
): void {
  if (data.access_token) {
    storage.setTokens(data.access_token, data.refresh_token);
  }

  if (data.expires_in && storage.setTokenExpiry) {
    storage.setTokenExpiry(data.expires_in);
  }

  if (data.id_token && typeof window !== 'undefined') {
    localStorage.setItem('id_token', data.id_token);
  }
}

/**
 * Clear all authentication tokens
 */
export function clearTokens(storage: {
  clearTokens?: () => void;
  removeTokens?: () => void;
}): void {
  if (storage.clearTokens) {
    storage.clearTokens();
  } else if (storage.removeTokens) {
    storage.removeTokens();
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('id_token');
  }
}

/**
 * Check if tokens are expired
 */
export function areTokensExpired(expiryTime: number): boolean {
  if (!expiryTime) return true;
  return Date.now() >= expiryTime;
}

/**
 * Extract access token from multiple possible field names
 * Handles different backend response formats
 */
export function extractAccessToken(data: Record<string, any>): string | null {
  return (
    data.accessToken ||
    data.access_token ||
    data.token ||
    data.data?.accessToken ||
    data.data?.access_token ||
    data.data?.token ||
    null
  );
}

/**
 * Extract refresh token from multiple possible field names
 */
export function extractRefreshToken(data: Record<string, any>): string | null {
  return (
    data.refreshToken ||
    data.refresh_token ||
    data.data?.refreshToken ||
    data.data?.refresh_token ||
    null
  );
}

/**
 * Extract token expiry from multiple possible field names
 */
export function extractTokenExpiry(data: Record<string, any>): number | null {
  return data.expiresIn || data.expires_in || data.data?.expiresIn || data.data?.expires_in || null;
}

/**
 * Extract all token data from response
 */
export function extractTokenData(data: Record<string, any>): TokenData | null {
  const accessToken = extractAccessToken(data);

  if (!accessToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: extractRefreshToken(data) || undefined,
    id_token: data.id_token || data.data?.id_token || undefined,
    expires_in: extractTokenExpiry(data) || undefined,
  };
}
