import { test, expect } from '@playwright/test';
import { USERS } from './data';

test.describe('ЛР6: сценарії входу', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('standard_user потрапляє до каталогу', async ({ page }) => {
    await page.getByPlaceholder('Username').fill(USERS.standard.username);
    await page.getByPlaceholder('Password').fill(USERS.standard.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/inventory\.html(?:\?.*)?$/);
    await expect(page.getByText('Products', { exact: true })).toBeVisible();
  });

  test('locked_out_user бачить помилку та залишається на сторінці входу', async ({ page }) => {
    await page.getByPlaceholder('Username').fill(USERS.locked.username);
    await page.getByPlaceholder('Password').fill(USERS.locked.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByTestId('error')).toBeVisible();
    await expect(page.getByTestId('error')).toContainText(/locked out/i);
    await expect(page).not.toHaveURL(/inventory\.html/);
  });

  test('порожнє ім’я користувача відхиляється', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByTestId('error')).toContainText(/Username is required/i);
    await expect(page).not.toHaveURL(/inventory\.html/);
  });
});
