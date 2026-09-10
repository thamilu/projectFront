/**
 * This app has no local email/password form — app/(auth)/login/page.tsx
 * auto-redirects to Keycloak SSO (see useAuthRedirect/useKeycloakLogin).
 * The login tests below follow the same real Keycloak-redirect pattern
 * already used in profile-update.spec.ts and seller-onboarding.spec.ts:
 * they wait for the redirect to Keycloak's own login form, then interact
 * with that. The "successful login" case needs real credentials (supplied
 * via env, never hardcoded) and is skipped without them, same as those
 * files — e.g.:
 *   E2E_USER_EMAIL=you@example.com E2E_USER_PASSWORD=yourpassword npm run test:e2e
 */
import { test, expect, type Page } from '@playwright/test';

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

function isOnKeycloak(url: string): boolean {
  return url.includes(':8080') || url.includes('/auth/');
}

function isConfigError(url: string): boolean {
  return url.includes('error=Configuration');
}

/**
 * Navigates to /login and waits for the redirect to Keycloak. If Keycloak
 * itself isn't reachable (NextAuth surfaces this as `?error=Configuration`
 * back on /login, e.g. when the identity provider isn't running in this
 * environment), skip rather than fail — that's an infrastructure
 * precondition this test can't control, distinct from a real app bug.
 */
async function gotoLoginAndAwaitKeycloak(page: Page, skip: typeof test.skip) {
  await page.goto('/login');
  await page.waitForURL((url) => isOnKeycloak(url.toString()) || isConfigError(url.toString()), {
    timeout: 15000,
  });
  skip(isConfigError(page.url()), 'Keycloak is not reachable from this environment.');
}

test.describe('Authentication Flow', () => {
  test('user can login successfully', async ({ page }) => {
    test.skip(
      !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
      'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run this test.'
    );

    await gotoLoginAndAwaitKeycloak(page, test.skip);

    await page.fill('#username, input[name="username"]', E2E_USER_EMAIL as string);
    await page.fill('#password, input[name="password"]', E2E_USER_PASSWORD as string);
    await page.click('#kc-login, input[type="submit"], button[type="submit"]');

    // A successful login redirects back to this app — Keycloak's own domain
    // is left behind, regardless of which page the callback URL resolves to.
    await page.waitForURL((url) => !isOnKeycloak(url.toString()), { timeout: 15000 });
    expect(isOnKeycloak(page.url())).toBe(false);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await gotoLoginAndAwaitKeycloak(page, test.skip);

    await page.fill('#username, input[name="username"]', 'nonexistent-user@example.com');
    await page.fill('#password, input[name="password"]', 'definitely-wrong-password');
    await page.click('#kc-login, input[type="submit"], button[type="submit"]');

    // Invalid credentials re-render Keycloak's own login form with an error
    // instead of redirecting back — assert on that rather than on exact
    // error copy, which is controlled by the Keycloak theme, not this app.
    await expect(page).toHaveURL(/:8080|\/auth\//);
    await expect(page.locator('#username, input[name="username"]')).toBeVisible();
  });
});

test.describe('Product Browsing', () => {
  test('user can search products', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('#header-global-search-input');
    await searchInput.fill('laptop');
    await searchInput.press('Enter');

    // Navigation + a rendered result state (grid, empty state, or error
    // state are all valid depending on live backend data) is what this test
    // can assert without depending on exact seeded product counts.
    await page.waitForURL(/\/search\?/);
    await expect(
      page.locator(
        '[data-testid="search-results-grid"], [data-testid="search-empty"], [data-testid="search-error"]'
      )
    ).toBeVisible({ timeout: 10000 });
  });
});
