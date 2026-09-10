/**
 * @file api-runtime.config.ts
 * @module shared/config
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * API Runtime Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Resolves and validates the API base URL, version, and timeout for the
 * current deployment environment.
 *
 * Design Principles:
 *  - Fail Fast: Validation errors thrown at startup, never silently at runtime
 *  - 12-Factor App: All config from environment variables, no hardcoded values
 *    in staging/production environments
 *  - Single Responsibility: One file owns all API runtime config resolution
 *  - Testable: Lazy singleton pattern with reset utility for unit tests
 *  - Observable: Startup logging for environment verification
 *
 * Environment Variables:
 *  - NEXT_PUBLIC_APP_ENV         — 'development' | 'staging' | 'production'
 *  - NEXT_PUBLIC_API_URL         — Base URL for API requests (required in prod)
 *  - NEXT_PUBLIC_API_VERSION     — API version prefix (default: 'v1')
 *
 * @see https://12factor.net/config
 */

import { env } from '@/env';

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AppEnvironment
 *
 * Identifies the deployment environment.
 * Controlled via NEXT_PUBLIC_APP_ENV environment variable.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * ApiRuntimeConfig
 *
 * Resolved and validated API configuration for the active environment.
 *
 * @property baseUrl - Absolute API base URL, no trailing slash
 * @property version - API version prefix (e.g., 'v1')
 * @property timeout - Request abort timeout in milliseconds
 */
export interface ApiRuntimeConfig {
  readonly baseUrl: string;
  readonly version: string;
  readonly timeout: number; // milliseconds
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Constants & Tokens
// ─────────────────────────────────────────────────────────────────────────────

/** Set of all valid environment identifiers for O(1) lookup */
const VALID_ENVIRONMENTS = new Set<AppEnvironment>(['development', 'staging', 'production']);

/** Valid API protocols — https required in non-development environments */
const VALID_PROTOCOLS = new Set(['http:', 'https:']);

/** API version string must match this pattern (e.g., v1, v2, v10) */
const API_VERSION_PATTERN = /^v\d+$/;

/**
 * TIMEOUTS
 *
 * Per-environment request timeout tokens in milliseconds.
 * Development is generous for debugging.
 * Production is strict to enforce API SLA compliance.
 */
const TIMEOUTS = {
  development: 30_000,
  staging: 15_000,
  production: 10_000,
} as const satisfies Record<AppEnvironment, number>;

const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 60_000;

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: Validation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getRequiredEnvVar
 *
 * Returns the env var value or throws if missing/empty.
 * Use for production-critical variables where no safe default exists.
 */
const getRequiredEnvVar = (key: string, value: string | undefined): string => {
  if (!value || value.trim() === '') {
    throw new Error(
      `[API Config] Missing required environment variable: "${key}". ` +
        `Ensure it is set in your deployment environment or .env file. ` +
        `The application cannot start without this value.`
    );
  }
  return value.trim();
};

/**
 * getOptionalEnvVar
 *
 * Returns the env var value or the provided fallback with a warning.
 * Use for variables where a safe default exists (development only).
 */
const getOptionalEnvVar = (key: string, value: string | undefined, fallback: string): string => {
  if (!value || value.trim() === '') {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `[API Config] Environment variable "${key}" is not set. ` +
          `Using default: "${fallback}". ` +
          `Set this variable explicitly for staging and production deployments.`
      );
    }
    return fallback;
  }
  return value.trim();
};

/**
 * validateBaseUrl
 *
 * Validates that the URL is absolute, well-formed, and uses an allowed protocol.
 * Returns a normalized URL without trailing slash.
 *
 * @throws Error if URL is malformed or uses an insecure protocol
 */
export const validateBaseUrl = (url: string, context: string): string => {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `[API Config] Invalid URL format for "${context}" environment: "${url}". ` +
        `Expected a valid absolute URL (e.g., https://api.example.com).`
    );
  }

  if (!VALID_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `[API Config] Invalid protocol for "${context}" environment: "${parsed.protocol}". ` +
        `Only http: and https: are permitted.`
    );
  }

  // Normalize: remove trailing slash
  return url.replace(/\/+$/, '');
};

/**
 * validateApiVersion
 *
 * Validates the API version string matches expected format (e.g., v1, v2).
 *
 * @throws Error if version format is invalid
 */
export const validateApiVersion = (version: string, context: string): string => {
  const normalized = version.trim().toLowerCase();

  if (!API_VERSION_PATTERN.test(normalized)) {
    throw new Error(
      `[API Config] Invalid API version for "${context}" environment: "${version}". ` +
        `Expected format: "v1", "v2", etc.`
    );
  }

  return normalized;
};

/**
 * validateTimeout
 *
 * Validates timeout is a positive integer within acceptable bounds.
 *
 * @throws Error if timeout is out of range or not an integer
 */
export const validateTimeout = (ms: number, context: string): number => {
  if (!Number.isInteger(ms) || ms < MIN_TIMEOUT_MS || ms > MAX_TIMEOUT_MS) {
    throw new Error(
      `[API Config] Invalid timeout for "${context}" environment: ${ms}ms. ` +
        `Must be an integer between ${MIN_TIMEOUT_MS}ms and ${MAX_TIMEOUT_MS}ms.`
    );
  }
  return ms;
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: Environment Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * resolveApiEnvironment
 *
 * Resolves the current deployment environment from NEXT_PUBLIC_APP_ENV.
 *
 * Behavior:
 *  - Unset / empty → 'development' with console warning
 *  - 'staging'     → 'staging'
 *  - 'production'  → 'production'
 *  - Unrecognized  → throws Error (prevents silent misconfiguration)
 *
 * Case-insensitive: 'PRODUCTION' and 'production' both resolve correctly.
 *
 * @returns Validated AppEnvironment
 * @throws Error for unrecognized environment values
 */
export const resolveApiEnvironment = (): AppEnvironment => {
  const raw =
    process.env.NEXT_PUBLIC_APP_ENV !== undefined
      ? process.env.NEXT_PUBLIC_APP_ENV
      : env.NEXT_PUBLIC_APP_ENV;

  if (!raw || raw.trim() === '') {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[API Config] NEXT_PUBLIC_APP_ENV is not set. ' +
          'Defaulting to "development". ' +
          'Explicitly set this variable in all non-local environments.'
      );
    }
    return 'development';
  }

  const normalized = raw.trim().toLowerCase() as AppEnvironment;

  if (!VALID_ENVIRONMENTS.has(normalized)) {
    throw new Error(
      `[API Config] Invalid NEXT_PUBLIC_APP_ENV value: "${raw}". ` +
        `Valid values are: ${[...VALID_ENVIRONMENTS].join(', ')}. ` +
        `Check your environment configuration.`
    );
  }

  return normalized;
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: Raw Config Table
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getRawApiConfigs
 *
 * Returns raw configurations loaded dynamically from environment inputs.
 */
const getRawApiConfigs = (): Record<AppEnvironment, ApiRuntimeConfig> => ({
  development: {
    baseUrl: getOptionalEnvVar(
      'NEXT_PUBLIC_API_URL',
      process.env.NEXT_PUBLIC_API_URL !== undefined
        ? process.env.NEXT_PUBLIC_API_URL
        : env.NEXT_PUBLIC_API_URL,
      'http://localhost:8082'
    ),
    version: getOptionalEnvVar(
      'NEXT_PUBLIC_API_VERSION',
      process.env.NEXT_PUBLIC_API_VERSION !== undefined
        ? process.env.NEXT_PUBLIC_API_VERSION
        : env.NEXT_PUBLIC_API_VERSION,
      'v1'
    ),
    timeout: TIMEOUTS.development,
  },

  staging: {
    baseUrl: getRequiredEnvVar(
      'NEXT_PUBLIC_API_URL',
      process.env.NEXT_PUBLIC_API_URL !== undefined
        ? process.env.NEXT_PUBLIC_API_URL
        : env.NEXT_PUBLIC_API_URL
    ),
    version: getOptionalEnvVar(
      'NEXT_PUBLIC_API_VERSION',
      process.env.NEXT_PUBLIC_API_VERSION !== undefined
        ? process.env.NEXT_PUBLIC_API_VERSION
        : env.NEXT_PUBLIC_API_VERSION,
      'v1'
    ),
    timeout: TIMEOUTS.staging,
  },

  production: {
    baseUrl: getRequiredEnvVar(
      'NEXT_PUBLIC_API_URL',
      process.env.NEXT_PUBLIC_API_URL !== undefined
        ? process.env.NEXT_PUBLIC_API_URL
        : env.NEXT_PUBLIC_API_URL
    ),
    version: getOptionalEnvVar(
      'NEXT_PUBLIC_API_VERSION',
      process.env.NEXT_PUBLIC_API_VERSION !== undefined
        ? process.env.NEXT_PUBLIC_API_VERSION
        : env.NEXT_PUBLIC_API_VERSION,
      'v1'
    ),
    timeout: TIMEOUTS.production,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: Lazy Singleton Resolver
// ─────────────────────────────────────────────────────────────────────────────

let _resolvedConfig: Readonly<ApiRuntimeConfig> | null = null;

/**
 * getApiRuntimeConfig
 *
 * Returns the validated, frozen API runtime configuration for the
 * current deployment environment.
 *
 * Uses lazy singleton pattern — resolved on first call, cached thereafter.
 * All validation runs at resolution time to fail fast at application startup.
 *
 * @returns Frozen, validated ApiRuntimeConfig
 * @throws Error if any config value fails validation
 *
 * @example
 * const config = getApiRuntimeConfig();
 * const url = `${config.baseUrl}/${config.version}/users`;
 */
export const getApiRuntimeConfig = (): Readonly<ApiRuntimeConfig> => {
  if (_resolvedConfig !== null) return _resolvedConfig;

  const environment = resolveApiEnvironment();
  const raw = getRawApiConfigs()[environment];

  _resolvedConfig = Object.freeze({
    baseUrl: validateBaseUrl(raw.baseUrl, environment),
    version: validateApiVersion(raw.version, environment),
    timeout: validateTimeout(raw.timeout, environment),
  });

  if (process.env.NODE_ENV !== 'production' || env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS) {
    console.info(
      `[API Config] Resolved — Environment: ${environment} | ` +
        `Base URL: ${_resolvedConfig.baseUrl} | ` +
        `Version: ${_resolvedConfig.version} | ` +
        `Timeout: ${_resolvedConfig.timeout}ms`
    );
  }

  return _resolvedConfig;
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 7: Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * _resetApiRuntimeConfig
 *
 * Resets the internal singleton for unit testing purposes only.
 * Allows each test to control its own environment configuration.
 *
 * @throws Error if called outside of test environment
 *
 * @internal
 */
export const _resetApiRuntimeConfig = (): void => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      '[API Config] _resetApiRuntimeConfig() is only available in test environments. ' +
        'Do not call this in production or staging code.'
    );
  }
  _resolvedConfig = null;
};
