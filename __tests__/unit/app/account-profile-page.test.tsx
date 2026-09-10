// ============================================================
// __tests__/unit/app/account-profile-page.test.tsx
// app/(customer)/account/profile/page.tsx — a Server Component, tested by
// invoking it directly as an async function (matches how the App Router
// actually calls it) rather than via RTL's render().
//
// Priorities:
//  - Unauthenticated users redirect to APP_ROUTES.AUTH_LOGIN (not a
//    hardcoded '/login' string).
//  - No PII (real name) in generateMetadata()'s title.
//  - The removed suspended/banned check stays removed — an authenticated
//    session with no `status` field must render normally, not redirect.
//  - The email-verification backend fetch only happens when
//    env.REQUIRE_EMAIL_VERIFICATION is actually true (performance: no
//    extra round-trip in the common/default case).
// ============================================================

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getServerAccessToken } from '@/core/auth/server-session';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { APP_ROUTES } from '@/shared/routes';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/core/auth/server-session', () => ({
  getServerAccessToken: jest.fn(),
}));

jest.mock('@/core/client/server-fetch', () => ({
  serverBackendFetch: jest.fn(),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

// @/env is a plain resolved object (t3-env), not a function. A test-file
// jest.mock('@/env', ...) call REPLACES __tests__/setup.ts's global mock
// entirely (test-file mocks win over setupFilesAfterEnv ones for the same
// path) — so this must carry every field other modules imported by this
// page read (shared/constants/api/endpoints.ts needs NEXT_PUBLIC_API_URL),
// not just the one field this test cares about, or those modules throw
// "Missing required environment variable" at import time instead.
const mockEnv = {
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
  SPRING_BOOT_API_URL: 'http://localhost:8080',
  BACKEND_API_URL: 'http://localhost:8080',
  INTERNAL_API_URL: 'http://localhost:8080',
  UPSTASH_REDIS_REST_URL: 'http://localhost:6379',
  UPSTASH_REDIS_REST_TOKEN: 'mock-token',
  NODE_ENV: 'test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
  NEXT_PUBLIC_KEYCLOAK_URL: 'http://localhost:8080',
  NEXT_PUBLIC_API_URL: 'http://localhost:8080',
  NEXT_PUBLIC_WS_URL: 'http://localhost:8090',
  REQUIRE_EMAIL_VERIFICATION: false,
};
jest.mock('@/env', () => ({
  get env() {
    return mockEnv;
  },
}));

jest.mock('@/features/users', () => ({
  ProfileForm: () => null,
  ProfileSkeleton: () => null,
}));
jest.mock('@/shared/ui/layout', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => children,
  PageViewTracker: () => null,
}));
jest.mock('@/shared/ui/molecules', () => ({
  Breadcrumb: () => null,
}));

const authenticatedSession = {
  user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com', roles: ['CUSTOMER'] },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockEnv.REQUIRE_EMAIL_VERIFICATION = false;
});

describe('ProfilePage — auth guard', () => {
  it('redirects to APP_ROUTES.AUTH_LOGIN when unauthenticated, not a hardcoded string', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const { default: ProfilePage } = await import(
      '@/app/(customer)/account/profile/page'
    );

    await expect(ProfilePage()).rejects.toThrow(`REDIRECT:${APP_ROUTES.AUTH_LOGIN}`);
  });

  it('renders normally for an authenticated session with no `status` field (no dead suspended/banned redirect)', async () => {
    (auth as jest.Mock).mockResolvedValue(authenticatedSession);
    const { default: ProfilePage } = await import(
      '@/app/(customer)/account/profile/page'
    );

    const result = await ProfilePage();
    expect(result).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('ProfilePage — email verification gate', () => {
  it('does not call the backend when REQUIRE_EMAIL_VERIFICATION is false (default)', async () => {
    (auth as jest.Mock).mockResolvedValue(authenticatedSession);
    const { default: ProfilePage } = await import(
      '@/app/(customer)/account/profile/page'
    );

    await ProfilePage();

    expect(getServerAccessToken).not.toHaveBeenCalled();
    expect(serverBackendFetch).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to verify-email when enabled and the backend reports emailVerified: false', async () => {
    mockEnv.REQUIRE_EMAIL_VERIFICATION = true;
    (auth as jest.Mock).mockResolvedValue(authenticatedSession);
    (getServerAccessToken as jest.Mock).mockResolvedValue('token-123');
    (serverBackendFetch as jest.Mock).mockResolvedValue({
      data: { emailVerified: false, createdAt: '2024-01-01T00:00:00Z' },
    });
    const { default: ProfilePage } = await import(
      '@/app/(customer)/account/profile/page'
    );

    await expect(ProfilePage()).rejects.toThrow('REDIRECT:/account/verify-email');
  });

  it('renders normally when enabled and the backend reports emailVerified: true', async () => {
    mockEnv.REQUIRE_EMAIL_VERIFICATION = true;
    (auth as jest.Mock).mockResolvedValue(authenticatedSession);
    (getServerAccessToken as jest.Mock).mockResolvedValue('token-123');
    (serverBackendFetch as jest.Mock).mockResolvedValue({
      data: { emailVerified: true, createdAt: '2024-01-01T00:00:00Z' },
    });
    const { default: ProfilePage } = await import(
      '@/app/(customer)/account/profile/page'
    );

    const result = await ProfilePage();
    expect(result).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('fails safe (redirects, does not grant access) if the backend fetch throws', async () => {
    mockEnv.REQUIRE_EMAIL_VERIFICATION = true;
    (auth as jest.Mock).mockResolvedValue(authenticatedSession);
    (getServerAccessToken as jest.Mock).mockResolvedValue('token-123');
    (serverBackendFetch as jest.Mock).mockRejectedValue(new Error('network down'));
    const { default: ProfilePage } = await import(
      '@/app/(customer)/account/profile/page'
    );

    await expect(ProfilePage()).rejects.toThrow('REDIRECT:/account/verify-email');
  });
});

describe('ProfilePage — generateMetadata', () => {
  it('never includes the user\'s real name in the title (no PII in browser chrome/history)', async () => {
    (auth as jest.Mock).mockResolvedValue(authenticatedSession);
    const { generateMetadata } = await import('@/app/(customer)/account/profile/page');

    const metadata = await generateMetadata();

    // The assertion that matters: a profile page's tab title and browser
    // history entry must never leak the account holder's name — history is
    // shared on shared devices and synced across a user's other machines.
    expect(metadata.title).not.toContain('Jane Doe');
    expect(metadata.title).not.toContain('jane@');

    // The site suffix is supplied by the (customer) layout's `title.template`,
    // not by this page. It was previously hardcoded here as
    // "Profile Settings | eShop", which the template then doubled into
    // "Profile Settings | eShop | Your Account" in the actual tab.
    expect(metadata.title).toBe('Profile Settings');
  });

  it('still marks the page noindex/nofollow/noarchive for privacy', async () => {
    (auth as jest.Mock).mockResolvedValue(authenticatedSession);
    const { generateMetadata } = await import('@/app/(customer)/account/profile/page');

    const metadata = await generateMetadata();

    expect(metadata.robots).toMatchObject({ index: false, follow: false, noarchive: true });
  });
});
