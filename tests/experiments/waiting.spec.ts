import { test, expect } from '@playwright/test';
import { USERS } from '../e2e/data';

test.describe('Експеримент: явна пауза проти автоматичного очікування', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Username').fill(USERS.slow.username);
    await page.getByPlaceholder('Password').fill(USERS.slow.password);
  });

  // ВАЖЛИВО: DOM click через evaluate використано ВИКЛЮЧНО в експерименті.
  // Це прибирає автоматичне очікування навігації від Playwright locator.click(),
  // щоб порівняння стосувалося саме очікувальних тверджень і фіксованих пауз.
  async function startLoginWithoutNavigationWait(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: 'Login' }).evaluate((button: HTMLElement) => {
      button.click();
    });
  }

  test('@fixed-1000 очікування 1000 мс, одноразова перевірка', async ({ page }) => {
    await startLoginWithoutNavigationWait(page);
    await page.waitForTimeout(1000); // тільки в дослідному тесті
    expect(page.url()).toMatch(/inventory\.html/); // НЕ має автоповторів
  });

  test('@auto-wait твердження, що автоматично очікує URL', async ({ page }) => {
    await startLoginWithoutNavigationWait(page);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('@fixed-5000 очікування 5000 мс, одноразова перевірка', async ({ page }) => {
    await startLoginWithoutNavigationWait(page);
    await page.waitForTimeout(5000); // тільки в дослідному тесті
    expect(page.url()).toMatch(/inventory\.html/); // НЕ має автоповторів
  });
});
