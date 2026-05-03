/**
 * Environment Variable Validation Utility
 *
 * Validates required environment variables at build time
 * Prevents runtime errors from missing configuration
 *
 * @module lib/validation/env-validator
 */

interface EnvValidationError {
  variable: string;
  reason: string;
}

interface EnvValidationResult {
  isValid: boolean;
  errors: EnvValidationError[];
  warnings: string[];
}

interface EnvValidatorConfig {
  /**
   * Required environment variables
   * Format: { varName: description }
   */
  required: Record<string, string>;

  /**
   * Optional environment variables with defaults
   * Format: { varName: { description, default } }
   */
  optional?: Record<string, { description: string; default: string }>;

  /**
   * Pattern validation for specific variables
   * Format: { varName: regex }
   */
  patterns?: Record<string, RegExp>;
}

/**
 * Validates environment variables against a configuration
 *
 * @param config - Validation configuration
 * @param env - Environment object (defaults to process.env)
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```ts
 * const result = validateEnv({
 *   required: {
 *     'NEXT_PUBLIC_API_URL': 'Backend API URL',
 *     'DATABASE_URL': 'PostgreSQL connection string'
 *   },
 *   patterns: {
 *     'NEXT_PUBLIC_API_URL': /^https?:\/\/.+/
 *   }
 * });
 *
 * if (!result.isValid) {
 *   console.error('Environment validation failed:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
export function validateEnv(
  config: EnvValidatorConfig,
  env: NodeJS.ProcessEnv = process.env
): EnvValidationResult {
  const errors: EnvValidationError[] = [];
  const warnings: string[] = [];

  // Validate required variables
  for (const [varName, description] of Object.entries(config.required)) {
    const value = env[varName];

    if (!value || value.trim() === '') {
      errors.push({
        variable: varName,
        reason: `Missing required variable: ${description}`,
      });
      continue;
    }

    // Pattern validation
    if (config.patterns?.[varName]) {
      const pattern = config.patterns[varName];
      if (!pattern.test(value)) {
        errors.push({
          variable: varName,
          reason: `Invalid format for ${description}. Expected pattern: ${pattern}`,
        });
      }
    }
  }

  // Check optional variables
  if (config.optional) {
    for (const [varName, { description, default: defaultValue }] of Object.entries(
      config.optional
    )) {
      const value = env[varName];

      if (!value || value.trim() === '') {
        warnings.push(`${varName} not set. Using default: ${defaultValue} (${description})`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that environment is valid, throws if not
 *
 * @param config - Validation configuration
 * @throws {Error} If validation fails
 *
 * @example
 * ```ts
 * // At app startup
 * assertEnv({
 *   required: {
 *     'NEXT_PUBLIC_API_URL': 'Backend API URL'
 *   }
 * });
 * ```
 */
export function assertEnv(config: EnvValidatorConfig): void {
  const result = validateEnv(config);

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Warnings:');
    result.warnings.forEach((warning) => console.warn(`   ${warning}`));
  }

  if (!result.isValid) {
    console.error('❌ Environment Validation Failed:');
    result.errors.forEach((error) => {
      console.error(`   ${error.variable}: ${error.reason}`);
    });
    throw new Error('Invalid environment configuration. Please check your .env file.');
  }
}

/**
 * Formats environment value based on type
 *
 * @param value - Raw environment variable value
 * @param type - Expected type
 * @returns Typed value
 */
export function parseEnvValue<T = string>(
  value: string | undefined,
  type: 'string' | 'number' | 'boolean' | 'json' = 'string',
  defaultValue?: T
): T {
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('Environment value is required but not provided');
  }

  switch (type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Invalid number format: ${value}`);
      }
      return num as T;
    }

    case 'boolean': {
      const lower = value.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        throw new Error(`Invalid boolean format: ${value}`);
      }
      return (lower === 'true') as T;
    }

    case 'json': {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        throw new Error(`Invalid JSON format: ${value}`);
      }
    }

    default:
      return value as T;
  }
}

/**
 * Pre-configured validator for common Next.js + E-commerce setup
 *
 * @example
 * ```ts
 * // In next.config.js or instrumentation.ts
 * import { validateNextJsEnv } from '@/lib/validation/env-validator';
 *
 * validateNextJsEnv();
 * ```
 */
export function validateNextJsEnv(): void {
  assertEnv({
    required: {
      NEXT_PUBLIC_API_BASE_URL: 'Backend API base URL',
      NODE_ENV: 'Environment mode (development, production, test)',
    },
    optional: {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: {
        description: 'Cloudinary cloud name for image uploads',
        default: 'not-configured',
      },
      SENTRY_DSN: {
        description: 'Sentry DSN for error tracking',
        default: 'disabled',
      },
      LOG_LEVEL: {
        description: 'Minimum log level (debug, info, warn, error)',
        default: 'info',
      },
    },
    patterns: {
      NEXT_PUBLIC_API_BASE_URL: /^https?:\/\/.+/,
    },
  });
}
