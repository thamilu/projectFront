import { test, expect } from '@playwright/test';

// Keycloak login credentials for this E2E flow are supplied via the shell
// environment, never hardcoded — e.g.:
//   E2E_USER_EMAIL=you@example.com E2E_USER_PASSWORD=yourpassword npm run test:e2e
const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

test.describe('Seller Onboarding E2E Flow', () => {
  test('navigates to seller register, logs in, checks trust badges, and tests step 1 validation', async ({
    page,
  }) => {
    test.skip(
      !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
      'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run this test.'
    );
    // Enable logging
    page.on('console', (msg) => {
      console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (exception) => {
      console.log(`[Browser Page Error] ${exception.stack || exception.message}`);
    });

    console.log('Navigating to seller registration page...');
    await page.goto('/seller/register');

    console.log('Current URL:', page.url());

    // Check if we are redirected to Keycloak login
    if (page.url().includes(':8080') || page.url().includes('/auth')) {
      console.log('Redirected to Keycloak. Logging in...');
      await page.fill('#username, input[name="username"]', E2E_USER_EMAIL as string);
      await page.fill('#password, input[name="password"]', E2E_USER_PASSWORD as string);
      await page.click('#kc-login, input[type="submit"], button[type="submit"]');

      console.log('Submitted credentials. Waiting for redirect back...');
      await page.waitForURL('**/seller/register', { timeout: 15000 });
      console.log('Redirected back. Current URL:', page.url());
    }

    // Verify page title and header
    await expect(page).toHaveURL(/.*seller\/register/);
    const heading = page.locator('h1');
    await expect(heading).toContainText('Start Your Selling Journey');

    // Verify presence of trust badges
    const trustIndicators = page.locator('[aria-labelledby="trust-indicators-title"]');
    await expect(trustIndicators).toBeVisible();
    await expect(page.locator('text=Verified Sellers Only')).toBeVisible();
    await expect(page.locator('text=Setup in 5 Minutes')).toBeVisible();
    await expect(page.locator('text=No Upfront Costs')).toBeVisible();

    // Verify skip link is in the DOM
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Check that we render Step 1 form
    const personalInfoStep = page.locator('#step-panel-personal-info');
    await expect(personalInfoStep).toBeVisible();

    // Test form validation: try clicking 'Next Step' without filling fields
    const nextButton = page.locator('button:has-text("Next Step")');
    await nextButton.click();

    // Toast error or validation errors should appear
    console.log('Clicked Next Step without filling fields. Checking validation state...');
    const errorToast = page.locator('text=Please fix the errors in this step before proceeding');
    await expect(errorToast).toBeVisible();
    // It should focus the first invalid field (firstName input)
    const firstNameInput = page.locator('input[name="firstName"]');
    await expect(firstNameInput).toBeFocused();
  });
});
