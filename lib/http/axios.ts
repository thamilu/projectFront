import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { env } from '@/env';

/**
 * [HARDEN] Base API Client Configuration
 * 
 * - Server: Uses absolute SPRING_BOOT_API_URL and direct auth injection.
 * - Client: Uses relative /api/v1 to leverage Next.js proxy and automatic cookie handling.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: typeof window === 'undefined' ? env.SPRING_BOOT_API_URL : '',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ==================== RETRY CONFIGURATION ====================
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    return 1000 * Math.pow(2, retryCount - 1); // Exponential backoff
  },
  retryCondition: (error) => {
    const isNetworkError = !error.response;
    const isServerError = error.response?.status ? error.response.status >= 500 : false;
    
    const isIdempotentMethod = ['get', 'head', 'options', 'put', 'delete'].includes(
      error.config?.method?.toLowerCase() || ''
    );

    return (isNetworkError || isServerError) && isIdempotentMethod;
  },
});
