import { test, expect } from '@playwright/test';

test.describe('Documents (authenticated)', () => {
  // Un vrai backend Supabase est désormais démarré en CI (`supabase start`),
  // mais ces tests authentifiés restent ignorés tant qu'un utilisateur de test
  // n'est pas seedé et qu'un état d'auth partagé n'est pas configuré.
  // Étape restante : créer l'utilisateur via l'API admin (clé service_role de
  // la stack locale) puis configurer e2e/auth.setup.ts avec le pattern
  // storageState : https://playwright.dev/docs/auth#basic-shared-account-in-all-tests

  test.skip('should display documents list', async ({ page }) => {
    await page.goto('/user/documents');
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
  });

  test.skip('should allow creating new document', async ({ page }) => {
    await page.goto('/user/documents');
    await page.getByRole('button', { name: /nouveau|créer/i }).click();
    await expect(page.getByText(/nouveau document/i)).toBeVisible();
  });

  test.skip('should allow uploading file', async ({ page }) => {
    await page.goto('/user/documents/new');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content'),
    });

    await expect(page.getByText(/test.pdf/i)).toBeVisible();
  });
});

test.describe('Public Document Access', () => {
  test('should show error for non-existent document token', async ({ page }) => {
    await page.goto('/external/invalid-token');
    await expect(page.getByText(/introuvable|non trouvé|404|erreur/i)).toBeVisible();
  });
});
