import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { env } from '@/env';
import { API_CONFIG } from '@/shared/constants/api/endpoints';

const isServer = typeof window === 'undefined';

/** Server SSR must fail fast when backend is unavailable; client keeps longer tolerance. */
const API_TIMEOUT_MS = isServer ? 1_200 : API_CONFIG.TIMEOUT.DEFAULT;
const API_RETRY_COUNT = isServer ? 0 : API_CONFIG.RETRY.MAX_ATTEMPTS;

export const apiClient: AxiosInstance = axios.create({
  baseURL: isServer ? env.INTERNAL_API_URL || env.SPRING_BOOT_API_URL : '',
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Helper to extract Retry-After header delay in milliseconds
const getRetryAfterDelayMs = (error: any): number | null => {
  const retryAfter = error.response?.headers?.['retry-after'];
  if (!retryAfter) return null;

  // Numeric check (seconds)
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds) && String(seconds) === retryAfter.trim()) {
    return seconds * 1000;
  }

  // HTTP-Date check
  const date = Date.parse(retryAfter);
  if (!isNaN(date)) {
    const delay = date - Date.now();
    return delay > 0 ? delay : 0;
  }

  return null;
};

// Helper to calculate exponential backoff delay with jitter
const getBackoffDelay = (retryCount: number): number => {
  const { BASE_DELAY_MS, BACKOFF_FACTOR, MAX_DELAY_MS, JITTER_FACTOR } = API_CONFIG.RETRY;
  const baseDelay = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, retryCount - 1);
  const jitter = (Math.random() * 2 - 1) * JITTER_FACTOR * baseDelay;
  return Math.min(MAX_DELAY_MS, Math.max(0, baseDelay + jitter));
};

// ==================== RETRY CONFIGURATION ====================
axiosRetry(apiClient, {
  retries: API_RETRY_COUNT,
  retryDelay: (retryCount, error) => {
    const retryAfterDelay = getRetryAfterDelayMs(error);
    if (retryAfterDelay !== null) {
      return retryAfterDelay;
    }
    return getBackoffDelay(retryCount);
  },
  retryCondition: (error) => {
    // Only retry idempotent methods
    const method = error.config?.method?.toUpperCase() || '';
    const isIdempotent = API_CONFIG.RETRY.IDEMPOTENT_METHODS.includes(method as any);
    if (!isIdempotent) {
      return false;
    }

    // Network errors (no response) are retryable for idempotent methods
    if (!error.response) {
      return true;
    }

    // Server-side errors or retryable status codes
    const status = error.response.status;
    return (API_CONFIG.RETRY.RETRYABLE_STATUSES as readonly number[]).includes(status);
  },
});
