import { test, expect } from '@playwright/test';

// Keycloak login credentials for this E2E flow are supplied via the shell
// environment, never hardcoded — e.g.:
//   E2E_USER_EMAIL=you@example.com E2E_USER_PASSWORD=yourpassword npm run test:e2e
const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

test('login and save profile', async ({ page }) => {
  test.skip(
    !E2E_USER_EMAIL || !E2E_USER_PASSWORD,
    'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run this test.'
  );
  // Listen to console logs and page errors
  page.on('console', (msg) => {
    console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (exception) => {
    console.log(`[Browser Page Error] ${exception.stack || exception.message}`);
  });

  page.on('requestfailed', (request) => {
    console.log(
      `[Browser Request Failed] ${request.url()} - ${request.failure()?.errorText || 'Failed'}`
    );
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/v1/users/me') || url.includes('/users/me')) {
      console.log(`[Browser API Response] ${url} Status: ${response.status()}`);
      try {
        const text = await response.text();
        console.log(`[Browser API Response Body] ${text}`);
      } catch (e: any) {
        console.log(`Could not read response body: ${e.message}`);
      }
    }
  });

  console.log('Navigating to profile page...');
  await page.goto('/account/profile');

  // Check if we are redirected to Keycloak login
  console.log('Current URL:', page.url());

  if (page.url().includes(':8080') || page.url().includes('/auth')) {
    console.log('Redirected to Keycloak. Filling credentials...');
    // Keycloak standard login selectors:
    // Username input: id="username" or name="username"
    // Password input: id="password" or name="password"
    // Submit button: id="kc-login" or name="login"
    await page.fill('#username, input[name="username"]', E2E_USER_EMAIL as string);
    await page.fill('#password, input[name="password"]', E2E_USER_PASSWORD as string);
    await page.click('#kc-login, input[type="submit"], button[type="submit"]');

    console.log('Submitted credentials. Waiting for redirect back to profile page...');
    await page.waitForURL('**/account/profile', { timeout: 15000 });
    console.log('Redirected back. Current URL:', page.url());
  }

  // Verify we are on profile page
  await expect(page).toHaveURL(/.*account\/profile/);

  // Wait for page load / skeleton to disappear
  await page.waitForTimeout(3000);

  // Look for Edit button
  console.log('Looking for Edit Profile button...');
  const editButton = page.locator('button:has-text("Edit"), button:has-text("edit")');
  if (await editButton.isVisible()) {
    console.log('Clicking Edit button...');
    await editButton.click();
  }

  // Change first name or phone or preferred language
  console.log('Modifying First Name...');
  const firstNameInput = page.locator('input[name="firstName"]');
  await firstNameInput.fill('ThamiluN');

  // Click Save changes button
  console.log('Clicking Save changes button...');
  const saveButton = page.locator(
    'button:has-text("Save"), button:has-text("save"), button[type="submit"]'
  );
  await saveButton.click();

  console.log('Waiting to see the result...');
  await page.waitForTimeout(5000);
  console.log('Finished waiting.');
});
