/**
 * API Client re-export shim
 *
 * The canonical API client lives in `lib/api/api-client.ts` (includes
 * CircuitBreaker, /api/v1 version prefix, and shared error handling).
 *
 * This file is kept as a thin re-export so that any existing imports
 * from '@/lib/api-client' continue to work without changes.
 */
export { api, api as apiClient, request } from '@/lib/api/api-client';
export type { ApiResponse } from '@/lib/api/api-client';
