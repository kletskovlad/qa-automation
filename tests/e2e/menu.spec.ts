import { test, expect } from '@playwright/test';
import { loginStandard } from './helpers';

test.describe('ЛР6 — варіант 5: бічне меню та Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Playwright дає окремий контекст кожному тесту.
    await loginStandard(page);
  });

  test('меню відкривається й містить чотири очікувані пункти', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Menu' }).click();

    for (const name of ['All Items', 'About', 'Logout', 'Reset App State']) {
      await expect((name === 'About' ? page.getByRole('link', { name, exact: true }) : page.getByRole('button', { name, exact: true }))).toBeVisible();
      await expect((name === 'About' ? page.getByRole('link', { name, exact: true }) : page.getByRole('button', { name, exact: true }))).toHaveText(name);
    }
  });

  test('Logout повертає на форму входу', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Menu' }).click();
    const logout = page.getByRole('button', { name: 'Logout', exact: true });
    await expect(logout).toBeVisible();
    await logout.click();

    await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/?(?:\?.*)?$/);
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page).not.toHaveURL(/inventory\.html/);
  });
});
