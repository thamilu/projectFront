/**
 * Backend API Service
 * Handles all API calls to Spring Boot backend with JWT authentication
 */

import { getSession, signOut } from 'next-auth/react';
import { logger } from '@/lib/observability/logger';
import { authenticatedFetch, safeFetch } from '@/lib/utils/fetch-utils';
import { AuthenticationError, AuthorizationError } from '@/lib/utils/error-utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
const SERVER_BACKEND_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8082';

function headersToRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

/**
 * Generic backend fetch function with authentication
 */
export async function backendFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await getSession();

  const accessToken = (session as unknown as { accessToken?: string } | null)?.accessToken;

  if (!session || !accessToken) {
    logger.error('[Backend API] ❌ No access token available');
    throw new AuthenticationError('No access token available');
  }

  const url = `${BACKEND_URL}${endpoint}`;

  const { headers, ...rest } = options;

  try {
    const resp = await authenticatedFetch<T>(url, {
      ...rest,
      headers: headersToRecord(headers),
      accessToken: accessToken as string,
    });
    return resp as T;
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status === 401) {
      logger.error('[Backend API] ❌ Unauthorized - Token expired or invalid');
      signOut({ callbackUrl: '/auth/signin' });
      throw new AuthenticationError('Token expired or invalid');
    }

    if (e?.status === 403) {
      logger.error('[Backend API] ❌ Forbidden - Insufficient permissions');
      throw new AuthorizationError('Insufficient permissions');
    }

    // Re-throw or normalize
    throw err;
  }
}

// Type definitions for API responses
export interface SellerDashboardResponse {
  data: {
    shopOverview: {
      totalProducts: number;
      activeProducts: number;
      outOfStockProducts: number;
      shopRating: number | null;
    };
    orderManagement: {
      newOrders: number;
      processingOrders: number;
      shippedOrders: number;
      completedOrders: number;
    };
    topProducts: Array<{
      productId: number;
      productName: string;
      currentPrice: number;
      category: string;
      stockQuantity: number;
    }>;
  };
  role: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
}

export interface ProductListResponse {
  products: Product[];
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrderListResponse {
  orders: Order[];
}

/**
 * Seller API endpoints
 */
export const sellerApi = {
  getDashboard: () => backendFetch<SellerDashboardResponse>('/api/v1/dashboard/seller'),

  getProducts: () => backendFetch<ProductListResponse>('/api/v1/products/seller'),

  getOrders: () => backendFetch<OrderListResponse>('/api/v1/orders/seller'),
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Server-side backend fetch (for use in Server Components)
 */
export async function serverBackendFetch<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${SERVER_BACKEND_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  return safeFetch<T>(url, { ...options, headers, cache: 'no-store' });
}
