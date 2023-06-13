import { expect, test } from '@playwright/test';

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

  test('authenticate user', async ({ page }) => {
    // Click the login link.
    await page.getByRole('link', { name: 'Login' }).click();

    // Perform authentication steps.
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');
    await page.getByRole('button', { name: 'Accesso' }).click();

    // Wait until the page reaches a state where all is set (eg. server cookies).
    await page.waitForURL('**/it/')
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

    // End of authentication steps.
    await expect(page).toHaveTitle(/Home - G3W-SUITE/);
  });

  test('change language', async ({ page }) => {
    // Click the language switcher link.
    await page.getByRole('link', { name: 'Seleziona una lingua' }).click();
    await page.getByRole('link', { name: 'en_GBEnglish' }).click();
    await page.getByRole('link', { name: 'Choose a language' }).click(); // FIXME: users should not click again on dropdown

    // Authenticate user.
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait until the page reaches a state where all is set (eg. server cookies).
    await page.waitForURL('**/en/');
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

    // Click the search link.
    await page.getByRole('link', { name: 'Search' }).click();
    await page.waitForURL('**/en/search');

    // Click the logout link.
    await page.getByRole('link', { name: 'Logout' }).click();
    await page.waitForURL('**/en/search');
    await expect(page.getByRole('link', { name: 'Logout' })).not.toBeVisible();

    // Click the home link.
    await page.getByRole('link', { name: 'Home' }).click();
    await page.waitForURL('**/en/');
    await expect(page.getByRole('link', { name: 'Logout' })).not.toBeVisible();

    // Click the language switcher link.
    await page.getByRole('link', { name: 'Choose a language' }).click();
    await page.getByRole('link', { name: 'it_ITItaliano' }).click();
    await page.getByRole('link', { name: 'Seleziona una lingua' }).click();  // FIXME: users should not click again on dropdown

    // End of authentication steps.
    await page.waitForURL('**/it/');
    await expect(page.getByRole('link', { name: 'Logout' })).not.toBeVisible();
  });

});

test.describe('login_url and logout_url', () => {

  test.beforeEach(async ({ page }) => {
    // Modify the response
    await page.route('**/portal/api/infodata/', async (route) => {
      const response = await route.fetch();
      const result = await response.json();
      route.fulfill({
        body: JSON.stringify({
          ...result,
          login_url: 'https://www.example.com/login',
          logout_url: 'https://www.example.com/logout',
        })
      });
    });
  });

  test('login_url', async ({ page }) => {
    // Navigate to Home Page
    await page.goto('/');

    await page.getByRole('link', { name: 'Login' }).click();

    expect(page.url()).toBe('https://www.example.com/login');
  });

  test('logout_url', async ({ page }) => {

    // Modify the response
    await page.route('**/portal/api/whoami/', async (route) => {
      route.fulfill({
        body: JSON.stringify({
          is_authenticated: true,
          username: 'admin',
        })
      });
    });

    // Navigate to Home Page
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

    await page.getByRole('link', { name: 'Logout' }).click();

    expect(page.url()).toBe('https://www.example.com/logout');
  });

});