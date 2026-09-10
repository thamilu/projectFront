import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Auth.js / Keycloak
    KEYCLOAK_CLIENT_SECRET: z.string().min(1),
    KEYCLOAK_CLIENT_ID: z.string().min(1),
    KEYCLOAK_ISSUER: z.string().min(1),
    // Signs/encrypts the session JWT — a short or template-default value
    // would pass silently and make the session forgeable. NextAuth's own
    // guidance is >=32 random bytes (e.g. `openssl rand -base64 32`).
    AUTH_SECRET: z.string().min(32),
    AUTH_TRUST_HOST: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    AUTH_SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60),
    AUTH_SESSION_UPDATE_AGE_SECONDS: z.coerce.number().int().positive().default(24 * 60 * 60),
    AUTH_REFRESH_MAX_RETRIES: z.coerce.number().int().min(1).default(2),
    AUTH_REFRESH_BASE_DELAY_MS: z.coerce.number().int().positive().default(500),
    AUTH_REFRESH_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
    AUTH_REFRESH_BUFFER_SECONDS: z.coerce.number().int().min(0).default(10),
    AUTH_BACKEND_ROLE_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000),
    AUTH_BACKEND_ROLE_MAX_RETRIES: z.coerce.number().int().min(1).default(1),
    AUTH_BACKEND_ROLE_BASE_DELAY_MS: z.coerce.number().int().positive().default(200),
    // Per-request timeout for the Upstash Redis distributed refresh lock.
    // Redis/Upstash REST calls should be near-instant; this bounds the
    // "credentials point at an unreachable/misconfigured host" failure mode
    // (an @upstash/redis fetch()'s own default timeout is far longer than
    // acceptable on the hot jwt() callback path — see token-refresh.ts).
    AUTH_DIST_LOCK_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000),

    // Stripe — both optional since Stripe payments are an optional feature
    // (mirrors NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY's optionality below); when
    // either is configured the other must be too for the webhook route to
    // do anything useful, but that's a deployment-config concern, not
    // something to enforce with a schema-level .refine() here.
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

    /**
     * Service credential used for server-to-server calls made on behalf of an
     * external system rather than a signed-in user — currently only the Stripe
     * webhook, which has no session token to forward.
     *
     * Previously read as a bare `process.env.INTERNAL_API_SECRET`, so an unset
     * value silently produced `Authorization: Bearer undefined` and a 401 from
     * the backend, surfacing as orders that never left PENDING with no
     * indication of the cause. Declared here so a misconfigured deployment
     * fails at startup instead.
     *
     * Optional for the same reason as the Stripe keys above: payments are an
     * optional feature, and requiring this would break deployments that do not
     * enable them.
     */
    INTERNAL_API_SECRET: z.string().min(16).optional(),

    // Backend
    SPRING_BOOT_API_URL: z.string().url().min(1),
    BACKEND_API_URL: z.string().url().optional(),
    INTERNAL_API_URL: z.string().url().optional(),

    // Redis / Rate Limiting
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    // Feature flags
    // Gates the server-side email-verification redirect in
    // app/(customer)/account/profile/page.tsx. Defaults to false: enabling
    // it requires a real /account/verify-email page to exist first (not
    // yet built), otherwise every unverified user redirects into a 404.
    REQUIRE_EMAIL_VERIFICATION: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

    // System
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    GOOGLE_SITE_VERIFICATION: z.string().optional(),
    YANDEX_VERIFICATION: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    // Feeds shared/config/security-headers.ts's CSP img-src/connect-src —
    // omitting it in a deployment that actually serves product images from
    // R2 means those images 404 under CSP with no startup error pointing at
    // the cause, so it's validated here rather than read as a raw env var.
    NEXT_PUBLIC_R2_PUBLIC_URL: z.string().url().optional(),
    NEXT_PUBLIC_KEYCLOAK_URL: z.string().url().min(1),
    // Already set in .env.example/.env.local — wired into validation here so
    // features/auth/services/keycloak-account.ts can build real Keycloak
    // Account Console URLs (change password, active sessions) without
    // parsing the realm out of the server-only KEYCLOAK_ISSUER, which isn't
    // available in client components.
    NEXT_PUBLIC_KEYCLOAK_REALM: z.string().min(1),
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_APP_ENV === 'production' ||
      process.env.NEXT_PUBLIC_APP_ENV === 'staging'
        ? z.string().url()
        : z.string().url().optional(),
    NEXT_PUBLIC_API_VERSION: z.string().default('v1'),
    NEXT_PUBLIC_WS_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    NEXT_PUBLIC_DEFAULT_CURRENCY: z
      .string()
      .regex(/^[A-Z]{3}$/, 'Must be a valid ISO 4217 currency code')
      .default('INR'),
    NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: z.string().min(1).max(5).default('₹'),
    NEXT_PUBLIC_DEFAULT_LOCALE: z
      .string()
      .regex(/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/, 'Must be a valid BCP 47 locale')
      .default('en-IN'),
    NEXT_PUBLIC_DEFAULT_PAGE_SIZE: z.coerce.number().int().min(1).max(200).default(20),
    NEXT_PUBLIC_MAX_PAGE_SIZE: z.coerce.number().int().min(1).max(200).default(100),
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default('App'),
    NEXT_PUBLIC_APP_VERSION: z.string().min(1).default('1.0.0'),
    NEXT_PUBLIC_ENABLE_DEBUG_LOGS: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
  },

  /**
   * For Next.js >= 13.4.4, you only need to provide the client-side variables here.
   * The server-side variables will be automatically picked up from process.env on the server.
   * This prevents server-only secrets from being bundled in the client-side code.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    NEXT_PUBLIC_KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    NEXT_PUBLIC_KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
    NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_DEFAULT_PAGE_SIZE: process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE,
    NEXT_PUBLIC_MAX_PAGE_SIZE: process.env.NEXT_PUBLIC_MAX_PAGE_SIZE,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_ENABLE_DEBUG_LOGS: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS,
  },

  onValidationError: (issues: any) => {
    const message = JSON.stringify(issues, null, 2);
    console.error('❌ Invalid environment variables:', message);
    throw new Error(`Invalid environment variables: ${message}`);
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
