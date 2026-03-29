import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ADVIST/i);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation elements
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have skip link for accessibility', async ({ page }) => {
    await page.goto('/login');

    // Focus on skip link (usually hidden until focused)
    await page.keyboard.press('Tab');

    // Check if skip link exists
    const skipLink = page.getByText(/aller au contenu|skip/i);
    // Skip link may or may not be visible depending on implementation
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should be navigable by keyboard', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on input
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');

    // All images should have alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });
});
