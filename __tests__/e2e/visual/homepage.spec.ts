import { test, expect } from '@playwright/test';

test('homepage renders correctly in light mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('homepage-light.png', {
    fullPage: true,
    animations: 'disabled',
  });
});

test('homepage renders correctly in dark mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Emulate user setting scheme to dark
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page).toHaveScreenshot('homepage-dark.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
