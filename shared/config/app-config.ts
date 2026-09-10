/**
 * @file app-config.ts
 * @module shared/config
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Application Runtime Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Single source of truth for application-level runtime settings:
 * internationalization, currency, pagination, and UI preferences.
 *
 * Design Principles:
 *  - Fail Fast: Invalid config throws at startup, not at render time
 *  - Validated: All values checked against known-good formats
 *  - Consistent: Follows same lazy singleton pattern as api-runtime.config.ts
 *  - Typed: Full TypeScript interface with JSDoc on every property
 *  - Testable: Pure factory function for Dependency Inversion + reset hook
 *
 * Scope:
 *  ✅ Currency / locale settings
 *  ✅ Pagination defaults
 *  ✅ Application metadata
 *  ❌ API endpoints → see api-runtime.config.ts
 *  ❌ Authentication → see auth-config.ts
 *
 * @see shared/config/api-runtime.config.ts — for API configuration
 */

import { env } from '@/env';

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AppConfig
 *
 * Validated, frozen application runtime configuration.
 * Access via getAppConfig() — never construct directly.
 */
export interface AppConfig {
  /**
   * ISO 4217 three-letter currency code for price formatting.
   * @example 'INR' | 'USD' | 'EUR' | 'GBP'
   */
  readonly defaultCurrency: string;

  /**
   * Display symbol for the default currency.
   * Used in price display components alongside formatted numbers.
   * @example '₹' | '$' | '€' | '£'
   */
  readonly defaultCurrencySymbol: string;

  /**
   * BCP 47 locale code for Intl formatting (dates, numbers, currency).
   * @example 'en-IN' | 'en-US' | 'de-DE'
   */
  readonly defaultLocale: string;

  /**
   * Default number of items per paginated list.
   * Must be a positive integer.
   */
  readonly defaultPageSize: number;

  /**
   * Maximum allowed items per paginated request.
   * Prevents accidental large dataset requests.
   */
  readonly maxPageSize: number;

  /**
   * Human-readable application name.
   * Used in page titles, emails, and metadata.
   */
  readonly appName: string;

  /**
   * Application version string from package.json or env.
   * Used for cache busting and support context.
   */
  readonly appVersion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Validation Constants
// ─────────────────────────────────────────────────────────────────────────────

/** ISO 4217 currency code format: exactly 3 uppercase letters */
const ISO_4217_PATTERN = /^[A-Z]{3}$/;

/**
 * BCP 47 locale format: language[-region]
 * Examples: en-IN, en-US, de-DE, zh-CN
 */
const BCP_47_PATTERN = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/;

const CURRENCY_SYMBOL_MAX_LENGTH = 5;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 200;

/** Pattern for detecting control characters / null bytes */
const CONTROL_CHAR_PATTERN = /[\x00-\x1F\x7F-\x9F]/;

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: Validation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getOptionalEnvString
 *
 * Safely resolves environmental strings. Returns fallback default
 * on empty or undefined variables.
 */
const getOptionalEnvString = (key: string, value: string | undefined, fallback: string): string => {
  if (value === undefined || value.trim() === '') {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.warn(`[App Config] "${key}" is not set. Using default: "${fallback}".`);
    }
    return fallback;
  }
  return value.trim();
};

/**
 * getOptionalEnvNumber
 *
 * Safely resolves environmental numbers. Returns fallback default
 * on empty, undefined, or invalid numeric values.
 */
const getOptionalEnvNumber = (
  key: string,
  value: string | number | undefined,
  fallback: number
): number => {
  if (value === undefined || String(value).trim() === '') {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.warn(`[App Config] "${key}" is not set. Using default: "${fallback}".`);
    }
    return fallback;
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.warn(
        `[App Config] "${key}" is invalid number: "${value}". Using default: "${fallback}".`
      );
    }
    return fallback;
  }
  return parsed;
};

/**
 * validateCurrencyCode
 *
 * Ensures the currency code follows ISO 4217 format.
 * Prevents runtime errors in Intl.NumberFormat. Supports null/undefined checks.
 *
 * @throws Error if format is invalid
 */
export const validateCurrencyCode = (code: string | null | undefined, context: string): string => {
  if (code === null || code === undefined) {
    throw new Error(`[App Config] Currency code for "${context}" is required.`);
  }

  const normalized = String(code).trim().toUpperCase();

  if (!ISO_4217_PATTERN.test(normalized)) {
    throw new Error(
      `[App Config] Invalid currency code for "${context}": "${code}". ` +
        `Expected ISO 4217 format — exactly 3 uppercase letters (e.g., "INR", "USD", "EUR").`
    );
  }

  return normalized;
};

/**
 * validateCurrencySymbol
 *
 * Ensures the currency symbol is non-empty, contains no malicious control characters,
 * and resides within length bounds.
 *
 * @throws Error if symbol is empty, too long, or contains control characters
 */
export const validateCurrencySymbol = (
  symbol: string | null | undefined,
  context: string
): string => {
  if (symbol === null || symbol === undefined) {
    throw new Error(`[App Config] Currency symbol for "${context}" is required.`);
  }

  const trimmed = String(symbol).trim();

  if (trimmed.length === 0) {
    throw new Error(
      `[App Config] Empty currency symbol for "${context}". ` +
        `A non-empty display symbol is required (e.g., "₹", "$", "€").`
    );
  }

  if (trimmed.length > CURRENCY_SYMBOL_MAX_LENGTH) {
    throw new Error(
      `[App Config] Currency symbol too long for "${context}": "${symbol}" ` +
        `(${trimmed.length} chars). Maximum length is ${CURRENCY_SYMBOL_MAX_LENGTH} characters.`
    );
  }

  if (CONTROL_CHAR_PATTERN.test(trimmed)) {
    throw new Error(`[App Config] Currency symbol contains invalid characters for "${context}".`);
  }

  return trimmed;
};

/**
 * validateLocale
 *
 * Ensures the locale follows BCP 47 format and is recognized by the
 * Intl API to prevent runtime formatting errors. Normalizes locale tag casings.
 *
 * @throws Error if locale format is invalid or not supported by Intl
 */
export const validateLocale = (locale: string | null | undefined, context: string): string => {
  if (locale === null || locale === undefined) {
    throw new Error(`[App Config] Locale for "${context}" is required.`);
  }

  const trimmed = String(locale).trim();

  if (!BCP_47_PATTERN.test(trimmed)) {
    throw new Error(
      `[App Config] Invalid locale format for "${context}": "${locale}". ` +
        `Expected BCP 47 format (e.g., "en-IN", "en-US", "de-DE").`
    );
  }

  // Normalize BCP 47 casing (e.g. en-in -> en-IN, EN-IN -> en-IN)
  const parts = trimmed.split('-');
  const normalized =
    parts.length > 1
      ? `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`
      : parts[0].toLowerCase();

  // Verify Intl actually supports this locale
  const supported = Intl.NumberFormat.supportedLocalesOf(normalized);
  if (supported.length === 0) {
    throw new Error(
      `[App Config] Locale "${normalized}" is not supported by the Intl API. ` +
        `Verify the locale code is correct.`
    );
  }

  return normalized;
};

/**
 * validatePageSize
 *
 * Ensures page size is a positive integer within acceptable bounds.
 * Handles checks against non-numbers, NaN, and Infinity.
 *
 * @throws Error if value is out of range, not an integer, NaN, or Infinity
 */
export const validatePageSize = (
  value: number | null | undefined,
  context: string,
  max: number
): number => {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'number' ||
    isNaN(value) ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < MIN_PAGE_SIZE ||
    value > max
  ) {
    throw new Error(
      `[App Config] Invalid page size for "${context}": ${value}. ` +
        `Must be an integer between ${MIN_PAGE_SIZE} and ${max}.`
    );
  }
  return value;
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: Pure Factory Resolver & Lazy Singleton
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AppConfigEnvSource
 *
 * The narrow structural shape resolveAppConfig actually reads from.
 * Deliberately independent of the concrete `@/env` module (Dependency
 * Inversion, per this file's design principles) — any object with these
 * fields works, real env module or test fixture alike — while still
 * avoiding `any`.
 */
export interface AppConfigEnvSource {
  readonly NEXT_PUBLIC_DEFAULT_CURRENCY?: string;
  readonly NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL?: string;
  readonly NEXT_PUBLIC_DEFAULT_LOCALE?: string;
  readonly NEXT_PUBLIC_DEFAULT_PAGE_SIZE?: string | number;
  readonly NEXT_PUBLIC_MAX_PAGE_SIZE?: string | number;
  readonly NEXT_PUBLIC_APP_NAME?: string;
  readonly NEXT_PUBLIC_APP_VERSION?: string;
}

/**
 * resolveAppConfig
 *
 * Dependency Inversion pure factory resolver.
 * Parses and validates raw environment inputs into a frozen configuration object.
 *
 * @param envSource - Key-value map of environment parameters (typically `@/env`).
 * @returns Frozen, validated AppConfig
 */
export const resolveAppConfig = (envSource: AppConfigEnvSource): Readonly<AppConfig> => {
  // ─── Raw values from env schema with safe defaults for unit testing ───
  const rawCurrency = getOptionalEnvString(
    'NEXT_PUBLIC_DEFAULT_CURRENCY',
    envSource.NEXT_PUBLIC_DEFAULT_CURRENCY,
    'INR'
  );
  const rawSymbol = getOptionalEnvString(
    'NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL',
    envSource.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL,
    '₹'
  );
  const rawLocale = getOptionalEnvString(
    'NEXT_PUBLIC_DEFAULT_LOCALE',
    envSource.NEXT_PUBLIC_DEFAULT_LOCALE,
    'en-IN'
  );
  const rawDefaultPageSize = getOptionalEnvNumber(
    'NEXT_PUBLIC_DEFAULT_PAGE_SIZE',
    envSource.NEXT_PUBLIC_DEFAULT_PAGE_SIZE,
    20
  );
  const rawMaxPageSize = getOptionalEnvNumber(
    'NEXT_PUBLIC_MAX_PAGE_SIZE',
    envSource.NEXT_PUBLIC_MAX_PAGE_SIZE,
    100
  );
  const rawAppName = getOptionalEnvString(
    'NEXT_PUBLIC_APP_NAME',
    envSource.NEXT_PUBLIC_APP_NAME,
    'App'
  );
  const rawAppVersion = getOptionalEnvString(
    'NEXT_PUBLIC_APP_VERSION',
    envSource.NEXT_PUBLIC_APP_VERSION,
    '1.0.0'
  );

  // ─── Validate semantic relationships ─────────────────────────────────────
  if (rawDefaultPageSize > rawMaxPageSize) {
    throw new Error(
      `[App Config] defaultPageSize (${rawDefaultPageSize}) cannot be greater than maxPageSize (${rawMaxPageSize}).`
    );
  }

  return Object.freeze({
    defaultCurrency: validateCurrencyCode(rawCurrency, 'defaultCurrency'),
    defaultCurrencySymbol: validateCurrencySymbol(rawSymbol, 'defaultCurrencySymbol'),
    defaultLocale: validateLocale(rawLocale, 'defaultLocale'),
    defaultPageSize: validatePageSize(rawDefaultPageSize, 'defaultPageSize', MAX_PAGE_SIZE),
    maxPageSize: validatePageSize(rawMaxPageSize, 'maxPageSize', MAX_PAGE_SIZE),
    appName: rawAppName,
    appVersion: rawAppVersion,
  } satisfies AppConfig);
};

let _resolvedAppConfig: Readonly<AppConfig> | null = null;

/**
 * getAppConfig
 *
 * Returns the validated, frozen application configuration for the
 * current deployment environment.
 *
 * Uses lazy singleton pattern — resolved on first call, cached thereafter.
 * All validation runs at resolution time to fail fast at application startup.
 *
 * @returns Frozen, validated AppConfig
 * @throws Error if any config value fails validation
 *
 * @example
 * const config = getAppConfig();
 * const formatter = new Intl.NumberFormat(config.defaultLocale, {
 *   style: 'currency',
 *   currency: config.defaultCurrency,
 * });
 */
export const getAppConfig = (): Readonly<AppConfig> => {
  if (_resolvedAppConfig !== null) return _resolvedAppConfig;

  _resolvedAppConfig = resolveAppConfig(env);

  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.info(
      `[App Config] Resolved — ` +
        `Currency: ${_resolvedAppConfig.defaultCurrency} (${_resolvedAppConfig.defaultCurrencySymbol}) | ` +
        `Locale: ${_resolvedAppConfig.defaultLocale} | ` +
        `Page size: ${_resolvedAppConfig.defaultPageSize}/${_resolvedAppConfig.maxPageSize}`
    );
  }

  return _resolvedAppConfig;
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: Test Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * _resetAppConfig
 *
 * Resets the internal singleton for unit testing.
 * Allows each test to control its own configuration state.
 *
 * @throws Error if called outside test environment
 * @internal
 */
export const _resetAppConfig = (): void => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('[App Config] _resetAppConfig() is only available in test environments.');
  }
  _resolvedAppConfig = null;
};
