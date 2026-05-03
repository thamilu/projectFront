/**
 * Sample E2E Test
 * Demonstrates end-to-end testing with Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can login successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify user is logged in
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});

test.describe('Product Browsing', () => {
  test('user can search products', async ({ page }) => {
    await page.goto('/products');

    // Search for product
    await page.fill('input[placeholder="Search products"]', 'laptop');
    await page.press('input[placeholder="Search products"]', 'Enter');

    // Verify search results
    await expect(page.locator('.product-card')).toHaveCount(5, { timeout: 5000 });
  });
});
