import { expect, test,  } from '@playwright/test';

test.describe('Home Page', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Home Page
    await page.goto('/');
  });

  test('has title', async ({ page }) => {
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Home - G3W-SUITE/);
  });

  test('login link', async ({ page }) => {
    // Click the login link.
    await page.getByRole('link', { name: 'Login' }).click();

    // Expects the URL to contain login.
    await expect(page).toHaveURL(/.*login/);
  });

});
