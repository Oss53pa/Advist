import { test, expect } from '@playwright/test';

// NB : l'UX d'auth a été redessinée — l'inscription et le mot de passe oublié
// sont désormais gérés sur le portail Atlas Studio (hors application). La page
// de connexion utilise des libellés stylés non associés aux champs (donc pas de
// getByLabel) ; on cible les champs par type. Ces tests reflètent l'app réelle.

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /connexion/i }).click();
    // Validation zod : « Email invalide » et/ou « Mot de passe requis ».
    await expect(page.getByText(/invalide|requis/i).first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('invalid@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /connexion/i }).click();
    // Vrai backend : GoTrue rejette → « Email ou mot de passe incorrect. »
    // (regex large pour couvrir un éventuel message brut en anglais).
    await expect(page.getByText(/incorrect|invalide|invalid|erreur|error/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('forgot-password link points to the Atlas Studio portal', async ({ page }) => {
    await page.goto('/login');
    // Le mot de passe oublié est géré sur le portail Atlas Studio (lien externe).
    await expect(page.getByRole('link', { name: /oublié/i })).toHaveAttribute(
      'href',
      /atlas-studio\.org.*forgot/i
    );
  });

  test('register CTA leads to the Atlas Studio redirect', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL(/register/);
    // /register redirige vers Atlas Studio (inscription gérée hors application).
    await expect(page.getByRole('heading', { name: /atlas studio/i })).toBeVisible();
  });
});

test.describe('Registration (redirigée vers Atlas Studio)', () => {
  test('/register affiche la redirection Atlas Studio (pas de formulaire in-app)', async ({
    page,
  }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /atlas studio/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /portail|accéder|atlas studio/i }).first()
    ).toBeVisible();
    // L'inscription n'est plus un formulaire dans l'app.
    await expect(page.locator('form')).toHaveCount(0);
  });
});
