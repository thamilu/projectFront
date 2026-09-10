import { test, expect } from '@playwright/test';

test('homepage loads successfully with status 200', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('stores page loads successfully with status 200', async ({ page }) => {
  const response = await page.goto('/stores');
  expect(response?.status()).toBe(200);
});
