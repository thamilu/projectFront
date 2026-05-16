// Authentication utilities for httpOnly cookie-based auth
// Tokens are stored in httpOnly cookies and managed by Next.js API routes

import { UserDTO, UserRole } from '@/types';
import { apiClient } from '@/lib/http/services';

const USER_KEY = 'user';

// ==================== USER MANAGEMENT ====================

/**
 * Store user data in localStorage (NOT the token - that's in httpOnly cookie)
 * Time Complexity: O(1)
 * Space Complexity: O(n) where n is size of user object
 */
export function setUser(user: UserDTO): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get user data from localStorage
 * Time Complexity: O(1)
 * Space Complexity: O(n) where n is size of user object
 */
export function getUser(): UserDTO | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    if (!user || user === 'undefined' || user === 'null') {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to parse user from storage:', error);
      }
      // Clear invalid data
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
  return null;
}

/**
 * Remove user data from localStorage
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

// ==================== AUTHENTICATION STATUS ====================

/**
 * Check if user is authenticated by checking the isAuthenticated cookie
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return document.cookie.includes('isAuthenticated=true');
  }
  return false;
}

/**
 * Get token (for backwards compatibility - tokens are now in httpOnly cookies)
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 * @deprecated Tokens are now stored in httpOnly cookies and sent automatically
 */
export function getToken(): string | null {
  // Tokens are in httpOnly cookies - not accessible from JavaScript
  if (process.env.NODE_ENV === 'development') {
    console.warn('getToken() is deprecated. Tokens are now in httpOnly cookies.');
  }
  return null;
}

// ==================== AUTH ACTIONS ====================

/**
 * Login user - calls Next.js API route which sets httpOnly cookies
 */
export async function login(email: string, password: string): Promise<UserDTO> {
  try {
    const { data } = await apiClient.post<{ user: UserDTO }>('/api/auth/login', {
      email,
      password,
    });

    setUser(data.user);
    return data.user;
  } catch (err: any) {
    throw new Error(err?.message || 'Login failed');
  }
}

/**
 * Register user - calls Next.js API route which sets httpOnly cookies
 */
export async function register(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}): Promise<UserDTO> {
  try {
    const { data } = await apiClient.post<{ user: UserDTO }>('/api/auth/register', userData);

    setUser(data.user);
    return data.user;
  } catch (err: any) {
    throw new Error(err?.message || 'Registration failed');
  }
}

/**
 * Logout user - calls Next.js API route to clear httpOnly cookies
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout', null, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  } finally {
    removeUser();
  }
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  removeUser();
}

// ==================== DEPRECATED FUNCTIONS ====================

/** @deprecated Use login() instead */
export function setToken(_token: string, _rememberMe: boolean = true): void {
  console.warn('setToken() is deprecated. Use login() instead.');
}

/** @deprecated Use logout() instead */
export function removeToken(): void {
  console.warn('removeToken() is deprecated. Use logout() instead.');
}

// Note: do not redeclare `isAuthenticated` - the primary implementation above checks cookies.

// Time Complexity: O(1)
// Space Complexity: O(1)
export function hasRole(role: UserRole): boolean {
  const user = getUser();
  if (!user) return false;
  // Support both backend DTO shape (`role`) and OIDC userinfo shape (`roles` array)
  // @ts-ignore
  if (user.role) return user.role === role;
  // @ts-ignore
  if (Array.isArray(user.roles)) return user.roles.includes(role);
  return false;
}

// Time Complexity: O(n) where n is number of allowed roles
// Space Complexity: O(1)
export function hasAnyRole(roles: UserRole[]): boolean {
  const user = getUser();
  if (!user) return false;
  // @ts-ignore
  if (user.role) return roles.includes(user.role);
  // @ts-ignore
  if (Array.isArray(user.roles)) return roles.some((r) => user.roles.includes(r));
  return false;
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function isSeller(): boolean {
  return hasRole(UserRole.SELLER);
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function isCustomer(): boolean {
  return hasRole(UserRole.CUSTOMER);
}

// Time Complexity: O(1)
// Space Complexity: O(1)
export function isDeliveryAgent(): boolean {
  return hasRole(UserRole.DELIVERY_AGENT);
}
