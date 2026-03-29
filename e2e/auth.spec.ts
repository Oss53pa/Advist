import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText(/email.*requis/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid@email.com');
    await page.getByLabel(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /se connecter/i }).click();
    // Expect error message (depends on backend response)
    await expect(page.getByText(/erreur|invalide|incorrect/i)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /inscription|créer.*compte/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /oublié/i }).click();
    await expect(page).toHaveURL(/reset|forgot/);
  });
});

test.describe('Registration', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i).first()).toBeVisible();
    await expect(page.getByLabel(/prénom/i)).toBeVisible();
    await expect(page.getByLabel(/nom/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/mot de passe/i).first().fill('short');
    await page.getByRole('button', { name: /inscription|créer/i }).click();
    await expect(page.getByText(/8.*caractères|minimum/i)).toBeVisible();
  });
});
