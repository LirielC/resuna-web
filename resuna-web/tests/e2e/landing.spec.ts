import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Verify page title
    await expect(page).toHaveTitle(/Resuna/);

    // Verify main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for navigation links
    const featuresLink = page.locator('a[href="/#features"]');
    await expect(featuresLink).toBeVisible();

    const atsLink = page.getByRole('link', { name: 'Analisador ATS', exact: true });
    await expect(atsLink).toBeVisible();

    const signInLink = page.locator('a[href="/login"]:visible').first();
    await expect(signInLink).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    // Use the CTA section signup button (not the animated hero button)
    // Both link to /signup, but the CTA one is not inside an animated container
    const signupButton = page.locator('a[href="/signup"]').last();
    await signupButton.scrollIntoViewIfNeeded();

    await Promise.all([
      page.waitForURL(/.*signup/, { timeout: 10000 }),
      signupButton.click(),
    ]);

    // Verify navigation
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should navigate to terms and privacy pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to Terms
    const termsLink = page.locator('footer a[href="/terms"]').last();
    await termsLink.scrollIntoViewIfNeeded();

    await Promise.all([
      page.waitForURL(/.*terms/, { timeout: 10000 }),
      termsLink.click(),
    ]);

    await expect(page).toHaveURL(/.*terms/);
    await expect(page.locator('h1')).toContainText(/Termos/i);

    // Go back
    await page.goto('/');

    // Navigate to Privacy
    const privacyLink = page.locator('footer a[href="/privacy"]').last();
    await privacyLink.scrollIntoViewIfNeeded();

    await Promise.all([
      page.waitForURL(/.*privacy/, { timeout: 10000 }),
      privacyLink.click(),
    ]);

    await expect(page).toHaveURL(/.*privacy/);
    await expect(page.locator('h1')).toContainText(/Privacidade/i);
  });

  test('should not have pricing section', async ({ page }) => {
    await page.goto('/');

    // Verify no pricing link in navigation (project is open source)
    const pricingLink = page.locator('text=Preços').or(page.locator('text=Pricing'));
    await expect(pricingLink).not.toBeVisible();
  });

  test('should open the ATS analyzer for visitors', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Analisador ATS', exact: true }).click();

    await expect(page).toHaveURL(/\/resumes\/upload$/);
    await expect(page.getByRole('heading', { name: 'Analisador ATS' })).toBeVisible();
    await expect(page.getByLabel('Currículo em PDF')).toBeVisible();
    await expect(page.getByLabel('Descrição da vaga')).toBeVisible();
  });
});
