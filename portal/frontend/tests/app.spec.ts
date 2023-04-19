import { expect, test,  } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Home - G3W-SUITE/);
});

test('login link', async ({ page }) => {
  await page.goto('/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Login' }).click();

  // Expects the URL to contain login.
  await expect(page).toHaveURL(/.*login/);
});
