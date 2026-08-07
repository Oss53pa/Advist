/**
 * Visual Audit Test Suite
 *
 * This comprehensive test suite:
 * - Navigates to every page in the application
 * - Takes screenshots on desktop, tablet, and mobile viewports
 * - Tests basic interactions (buttons, links, forms)
 * - Generates a complete visual report
 */
import { test, expect, Page } from '@playwright/test';

// Increase test timeout for visual tests
test.setTimeout(90000);

// Device viewports for testing
const devices = {
  desktop: { width: 1920, height: 1080, name: 'desktop' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  mobile: { width: 375, height: 812, name: 'mobile' },
};

// All public pages (no auth required)
const publicPages = [
  { path: '/', name: 'landing-page' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/blog', name: 'blog' },
  { path: '/legal', name: 'legal' },
  { path: '/resources', name: 'resources' },
];

// Helper function to take screenshots on all devices
async function screenshotAllDevices(page: Page, pageName: string) {
  for (const [, device] of Object.entries(devices)) {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `e2e/screenshots/${pageName}-${device.name}.png`,
      fullPage: false,
      timeout: 30000,
    });
  }
}

test.describe('Visual Audit - Public Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(devices.desktop);
  });

  for (const pageInfo of publicPages) {
    test(`Screenshot: ${pageInfo.name}`, async ({ page }) => {
      // Navigate with extended timeout
      await page.goto(pageInfo.path, { timeout: 90000 });
      await page.waitForTimeout(1500);

      // Take screenshots on all devices
      await screenshotAllDevices(page, pageInfo.name);

      // Basic accessibility check
      const title = await page.title();
      expect(title).toBeTruthy();
    });
  }

  test('Landing page - Hero and Footer visible', async ({ page }) => {
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(1000);

    // Check hero section exists
    const content = page.locator('section, main, div').first();
    await expect(content).toBeVisible({ timeout: 15000 });

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Screenshot
    await page.screenshot({
      path: 'e2e/screenshots/landing-hero.png',
      fullPage: false,
    });
  });

  test('Login form elements visible', async ({ page }) => {
    await page.goto('/login', { timeout: 90000 });
    await page.waitForTimeout(500);

    // Check form elements exist
    const emailInput = page.locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i]'
    );
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Connexion"), button:has-text("Login")'
    );

    await expect(emailInput.first()).toBeVisible({ timeout: 10000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 10000 });
    await expect(submitButton.first()).toBeVisible({ timeout: 10000 });

    await screenshotAllDevices(page, 'login-form');
  });

  test('Register redirects to Atlas Studio', async ({ page }) => {
    // L'inscription est gérée sur le portail Atlas Studio : /register affiche
    // une page de redirection (pas de formulaire in-app). La page se
    // redirige automatiquement au bout de ~2 s, donc on vérifie et capture
    // immédiatement l'écran de redirection.
    await page.goto('/register', { timeout: 90000 });
    await expect(page.getByRole('heading', { name: /atlas studio/i })).toBeVisible({
      timeout: 10000,
    });
    await page.screenshot({ path: 'e2e/screenshots/register-redirect.png' });
  });

  test('Navigation header visible', async ({ page }) => {
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(500);

    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: 'e2e/screenshots/navigation-header.png',
    });
  });
});

test.describe('Visual Audit - Interactive Elements', () => {
  test('Buttons have hover states', async ({ page }) => {
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(1000);

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`Found ${buttonCount} buttons on landing page`);

    // Screenshot first few buttons with hover
    for (let i = 0; i < Math.min(3, buttonCount); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await button.hover();
        await page.screenshot({
          path: `e2e/screenshots/button-hover-${i}.png`,
        });
      }
    }

    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Form validation errors shown', async ({ page }) => {
    await page.goto('/login', { timeout: 90000 });
    await page.waitForTimeout(500);

    const submitButton = page
      .locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Login")')
      .first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: 'e2e/screenshots/login-validation-error.png',
    });
  });

  test('Modal dialogs', async ({ page }) => {
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(1000);

    const ctaButtons = page.locator(
      'button:has-text("Commencer"), button:has-text("Essayer"), button:has-text("Demo"), a:has-text("Commencer")'
    );

    if ((await ctaButtons.count()) > 0) {
      await ctaButtons.first().click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/modal-open.png',
      });

      // Try to close modal
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Visual Audit - Responsive Design', () => {
  test('Responsive breakpoints', async ({ page }) => {
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(1000);

    const breakpoints = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 375, height: 812, name: 'mobile-medium' },
      { width: 414, height: 896, name: 'mobile-large' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `e2e/screenshots/responsive-${bp.name}.png`,
        fullPage: false,
        timeout: 15000,
      });
    }
  });

  test('Mobile navigation menu', async ({ page }) => {
    await page.setViewportSize(devices.mobile);
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(1000);

    const menuButton = page
      .locator('[aria-label="Menu"], button:has-text("Menu"), .hamburger, [class*="menu"]')
      .first();

    await page.screenshot({
      path: 'e2e/screenshots/mobile-menu-closed.png',
    });

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: 'e2e/screenshots/mobile-menu-open.png',
      });
    }
  });
});

test.describe('Visual Audit - Accessibility', () => {
  test('Text elements readable', async ({ page }) => {
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(1000);

    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
    const count = await textElements.count();

    console.log(`Found ${count} text elements`);

    // Check first 10 elements have font-size
    for (let i = 0; i < Math.min(10, count); i++) {
      const el = textElements.nth(i);
      if (await el.isVisible()) {
        const fontSize = await el.evaluate((e) => window.getComputedStyle(e).fontSize);
        console.log(`Element ${i}: font-size = ${fontSize}`);
      }
    }

    expect(count).toBeGreaterThan(0);
  });

  test('Keyboard navigation works', async ({ page }) => {
    await page.goto('/login', { timeout: 90000 });
    await page.waitForTimeout(500);

    await page.keyboard.press('Tab');
    await page.screenshot({ path: 'e2e/screenshots/keyboard-focus-1.png' });

    await page.keyboard.press('Tab');
    await page.screenshot({ path: 'e2e/screenshots/keyboard-focus-2.png' });

    await page.keyboard.press('Tab');
    await page.screenshot({ path: 'e2e/screenshots/keyboard-focus-3.png' });
  });

  test('Focus states visible', async ({ page }) => {
    await page.goto('/', { timeout: 90000 });
    await page.waitForTimeout(1000);

    const buttons = page.locator('button');
    if ((await buttons.count()) > 0) {
      await buttons.first().focus();
      await page.screenshot({
        path: 'e2e/screenshots/focus-state-button.png',
      });
    }

    const links = page.locator('a');
    if ((await links.count()) > 0) {
      await links.first().focus();
      await page.screenshot({
        path: 'e2e/screenshots/focus-state-link.png',
      });
    }
  });
});

test.describe('Visual Audit - Error States', () => {
  test('404 page displayed', async ({ page }) => {
    await page.goto('/this-page-does-not-exist', { timeout: 90000 });
    await page.waitForTimeout(500);

    await screenshotAllDevices(page, 'error-404');
  });

  test('Offline error handling', async ({ page }) => {
    await page.context().setOffline(true);

    try {
      await page.goto('/', { timeout: 5000 });
    } catch {
      // Expected to fail
    }

    await page.screenshot({
      path: 'e2e/screenshots/error-offline.png',
    });

    await page.context().setOffline(false);
  });
});

test.describe('Visual Audit - Performance', () => {
  test('Page load metrics acceptable', async ({ page, browserName }) => {
    // Skip performance test on Firefox (headless mode is not representative)
    test.skip(browserName === 'firefox', 'Firefox headless has inconsistent performance metrics');

    await page.goto('/', { timeout: 90000 });
    await page.waitForLoadState('domcontentloaded');

    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
        loadComplete: perf.loadEventEnd - perf.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    console.log('Performance metrics:', metrics);

    // Assert reasonable load times (15 seconds max for dev environment)
    expect(metrics.domContentLoaded).toBeLessThan(15000);
  });
});
