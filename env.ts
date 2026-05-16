import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // Auth.js / Keycloak
    KEYCLOAK_CLIENT_SECRET: z.string().min(1),
    KEYCLOAK_CLIENT_ID: z.string().min(1),
    KEYCLOAK_ISSUER: z.string().min(1),
    AUTH_SECRET: z.string().min(1),

    // Backend
    SPRING_BOOT_API_URL: z.string().url().min(1),
    BACKEND_API_URL: z.string().url().optional(),
    INTERNAL_API_URL: z.string().url().optional(),

    // Redis / Rate Limiting
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    // System
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_KEYCLOAK_URL: z.string().url().min(1),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
  },

  /**
   * For Next.js >= 13.4.4, you only need to provide the client-side variables here.
   * The server-side variables will be automatically picked up from process.env on the server.
   * This prevents server-only secrets from being bundled in the client-side code.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_KEYCLOAK_URL: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  onValidationError: (issues: any) => {
    const message = JSON.stringify(issues, null, 2);
    console.error('❌ Invalid environment variables:', message);
    throw new Error(`Invalid environment variables: ${message}`);
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})

