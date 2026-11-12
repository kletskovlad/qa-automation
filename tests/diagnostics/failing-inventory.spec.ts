import { test, expect } from '@playwright/test';
import { USERS } from '../e2e/data';

// НАВМИСНА ПОМИЛКА: застосунок має 6 товарів, а нижче очікуємо 7.
// Потрібна виключно для навчання Trace Viewer / HTML Reporter.
test('діагностика: навмисно неправильна кількість товарів (7)', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill(USERS.standard.username);
  await page.getByPlaceholder('Password').fill(USERS.standard.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/inventory\.html/);

  await expect(page.locator('.inventory_item')).toHaveCount(7);
});
