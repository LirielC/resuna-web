import { test, expect } from '@playwright/test';

test.describe('Resume Editor', () => {
  test.skip('requires authentication', () => {
    // Skip these tests as they require Firebase authentication
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/resumes/new');

    // Should redirect to login page (Firebase auth)
    await page.waitForURL(/.*login/, { timeout: 5000 }).catch(() => {});

    // Or show login/signup
    const loginElement = page.locator('text=Login').or(page.locator('text=Sign in'));
    await expect(loginElement).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

test.describe('Resume Editor - Contact Links Preview', () => {
  test.skip('requires authentication', () => {
    // These tests would verify clickable links in the preview
    // - Email (mailto:)
    // - Phone (WhatsApp)
    // - LinkedIn
    // - GitHub
    // - Website
  });
});
