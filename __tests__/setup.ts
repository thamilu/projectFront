/**
 * Unit Tests Setup
 * Configuration and utilities for unit testing
 */

import '@testing-library/jest-dom';

// Global mock for env configuration to avoid parsing ESM @t3-oss/env-nextjs in tests.
// Values here must be kept in sync with env.ts's actual defaults — a field
// present in env.ts but missing here silently resolves to `undefined` for
// every test, which is exactly what happened when AUTH_REFRESH_MAX_RETRIES
// was added to env.ts without being added here: `for (let i = 0; i <
// undefined; i++)` never executes, so every token-refresh test observed
// zero fetch calls with no error to explain why.
jest.mock('@/env', () => ({
  env: {
    KEYCLOAK_CLIENT_SECRET: 'mock-secret',
    KEYCLOAK_CLIENT_ID: 'mock-id',
    KEYCLOAK_ISSUER: 'http://mock-issuer',
    AUTH_SECRET: 'mock-auth-secret',
    AUTH_TRUST_HOST: false,
    AUTH_SESSION_MAX_AGE_SECONDS: 7 * 24 * 60 * 60,
    AUTH_SESSION_UPDATE_AGE_SECONDS: 24 * 60 * 60,
    AUTH_REFRESH_MAX_RETRIES: 2,
    AUTH_REFRESH_BASE_DELAY_MS: 500,
    AUTH_REFRESH_TIMEOUT_MS: 5_000,
    AUTH_REFRESH_BUFFER_SECONDS: 10,
    AUTH_BACKEND_ROLE_TIMEOUT_MS: 2_000,
    AUTH_BACKEND_ROLE_MAX_RETRIES: 1,
    AUTH_BACKEND_ROLE_BASE_DELAY_MS: 200,
    AUTH_DIST_LOCK_TIMEOUT_MS: 2_000,
    SPRING_BOOT_API_URL: 'http://localhost:8080',
    BACKEND_API_URL: 'http://localhost:8080',
    INTERNAL_API_URL: 'http://localhost:8080',
    UPSTASH_REDIS_REST_URL: 'http://localhost:6379',
    UPSTASH_REDIS_REST_TOKEN: 'mock-token',
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
    REQUIRE_EMAIL_VERIFICATION: false,
    NODE_ENV: 'test',
    GOOGLE_SITE_VERIFICATION: undefined,
    YANDEX_VERIFICATION: undefined,
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
    NEXT_PUBLIC_R2_PUBLIC_URL: 'https://r2.mock.example.com',
    NEXT_PUBLIC_KEYCLOAK_URL: 'http://localhost:8080',
    NEXT_PUBLIC_KEYCLOAK_REALM: 'eshop',
    NEXT_PUBLIC_API_URL: 'http://localhost:8080',
    NEXT_PUBLIC_API_VERSION: 'v1',
    NEXT_PUBLIC_WS_URL: 'http://localhost:8090',
    NEXT_PUBLIC_APP_ENV: 'development',
    NEXT_PUBLIC_DEFAULT_CURRENCY: 'INR',
    NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL: '₹',
    NEXT_PUBLIC_DEFAULT_LOCALE: 'en-IN',
    NEXT_PUBLIC_DEFAULT_PAGE_SIZE: 20,
    NEXT_PUBLIC_MAX_PAGE_SIZE: 100,
    NEXT_PUBLIC_APP_NAME: 'App',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_ENABLE_DEBUG_LOGS: false,
  },
}));

// Global mock for @sentry/nextjs. Without this, importing the real SDK
// (core/telemetry/logger.ts does, to forward logger.error() calls to
// Sentry) sets up client-side instrumentation as a module-scope side
// effect even though Sentry.init() is never called in tests — that left a
// worker process failing to exit gracefully after every full test run
// ("Active timers can also cause this"). A plain jest.fn() mock avoids
// depending on real SDK internals in unit tests entirely, and still lets
// a test assert `captureException`/`captureMessage` were called if it
// wants to.
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback: (scope: unknown) => void) => callback({})),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}));

// jsdom doesn't implement ResizeObserver at all — @radix-ui/react-use-size
// (used by RadioGroup, Select, and other size-tracking Radix primitives)
// calls `new ResizeObserver(...)` in a layout effect on every render,
// throwing "ResizeObserver is not defined" and failing the test outright
// for any component tree that renders one of those primitives, regardless
// of whether the test cares about resize behavior at all. A minimal no-op
// stub is sufficient — no test in this suite asserts on actual resize
// notifications.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;
