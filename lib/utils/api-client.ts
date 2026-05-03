/**
 * Centralized API Client
 * Single source of truth for all API calls
 * Follows DRY principle by centralizing common patterns
 */

import { authenticatedFetch, safeFetch, buildUrl } from './fetch-utils';
import { handleError } from './error-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api/v1';

// ============================================================================
// API Client Factory
// ============================================================================

/**
 * Create an API client with consistent patterns
 *
 * @example
 * ```ts
 * const cartApi = createApiClient('/cart');
 *
 * // GET /api/v1/cart
 * const cart = await cartApi.get(accessToken);
 *
 * // POST /api/v1/cart/items
 * await cartApi.post(accessToken, { productId: 1, quantity: 2 }, '/items');
 *
 * // PUT /api/v1/cart/items/123
 * await cartApi.put(accessToken, { quantity: 5 }, '/items/123');
 *
 * // DELETE /api/v1/cart/items/123
 * await cartApi.delete(accessToken, '/items/123');
 * ```
 */
export function createApiClient(basePath: string) {
  const baseUrl = `${API_BASE_URL}${basePath}`;

  return {
    /**
     * GET request
     */
    async get<T = unknown>(
      accessToken: string,
      path: string = '',
      params?: Record<string, string | number | boolean>
    ): Promise<T> {
      const url = buildUrl(`${baseUrl}${path}`, params);

      try {
        return await authenticatedFetch<T>(url, { accessToken });
      } catch (error) {
        handleError(error, `GET ${basePath}${path}`);
        throw error;
      }
    },

    /**
     * POST request
     */
    async post<T = unknown>(accessToken: string, data: unknown, path: string = ''): Promise<T> {
      try {
        return await authenticatedFetch<T>(`${baseUrl}${path}`, {
          method: 'POST',
          accessToken,
          body: JSON.stringify(data),
        });
      } catch (error) {
        handleError(error, `POST ${basePath}${path}`);
        throw error;
      }
    },

    /**
     * PUT request
     */
    async put<T = unknown>(accessToken: string, data: unknown, path: string = ''): Promise<T> {
      try {
        return await authenticatedFetch<T>(`${baseUrl}${path}`, {
          method: 'PUT',
          accessToken,
          body: JSON.stringify(data),
        });
      } catch (error) {
        handleError(error, `PUT ${basePath}${path}`);
        throw error;
      }
    },

    /**
     * PATCH request
     */
    async patch<T = unknown>(accessToken: string, data: unknown, path: string = ''): Promise<T> {
      try {
        return await authenticatedFetch<T>(`${baseUrl}${path}`, {
          method: 'PATCH',
          accessToken,
          body: JSON.stringify(data),
        });
      } catch (error) {
        handleError(error, `PATCH ${basePath}${path}`);
        throw error;
      }
    },

    /**
     * DELETE request
     */
    async delete<T = unknown>(accessToken: string, path: string = ''): Promise<T> {
      try {
        return await authenticatedFetch<T>(`${baseUrl}${path}`, {
          method: 'DELETE',
          accessToken,
        });
      } catch (error) {
        handleError(error, `DELETE ${basePath}${path}`);
        throw error;
      }
    },
  };
}

// ============================================================================
// Pre-configured API Clients
// ============================================================================

/**
 * Cart API client
 */
export const cartApi = {
  /**
   * Get user's cart
   */
  getCart: (accessToken: string) => createApiClient('/cart').get(accessToken),

  /**
   * Add item to cart
   */
  addItem: (accessToken: string, productId: number, quantity: number) =>
    createApiClient('/cart').post(accessToken, { productId, quantity }, '/items'),

  /**
   * Update item quantity
   */
  updateQuantity: (accessToken: string, itemId: number, quantity: number) =>
    createApiClient('/cart').put(accessToken, null, `/items/${itemId}?quantity=${quantity}`),

  /**
   * Remove item from cart
   */
  removeItem: (accessToken: string, itemId: number) =>
    createApiClient('/cart').delete(accessToken, `/items/${itemId}`),
};

/**
 * Products API client
 */
export const productsApi = {
  /**
   * Get all products
   */
  getAll: (params?: { page?: number; limit?: number; category?: string }) =>
    safeFetch(
      `${API_BASE_URL}/products${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
    ),

  /**
   * Get product by ID
   */
  getById: (id: number) => safeFetch(`${API_BASE_URL}/products/${id}`),

  /**
   * Search products
   */
  search: (query: string) =>
    safeFetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`),
};

/**
 * Orders API client
 */
export const ordersApi = {
  /**
   * Get seller orders
   */
  getSellerOrders: (accessToken: string) => createApiClient('/orders/seller').get(accessToken),

  /**
   * Get customer orders
   */
  getCustomerOrders: (accessToken: string) => createApiClient('/orders').get(accessToken),

  /**
   * Get order by ID
   */
  getById: (accessToken: string, orderId: number) =>
    createApiClient('/orders').get(accessToken, `/${orderId}`),
};

/**
 * Dashboard API client
 */
export const dashboardApi = {
  /**
   * Get seller dashboard
   */
  getSeller: (accessToken: string) => createApiClient('/dashboard/seller').get(accessToken),

  /**
   * Get customer dashboard
   */
  getCustomer: (accessToken: string) => createApiClient('/dashboard/customer').get(accessToken),

  /**
   * Get admin dashboard
   */
  getAdmin: (accessToken: string) => createApiClient('/dashboard/admin').get(accessToken),
};
