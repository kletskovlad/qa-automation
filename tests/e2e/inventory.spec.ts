import { test, expect } from '@playwright/test';
import { loginStandard } from './helpers';

test.describe('ЛР6: каталог товарів', () => {
  test.beforeEach(async ({ page }) => {
    await loginStandard(page);
  });

  // На Swag Labs стандартний HTML-клас .inventory_item є контейнером картки.
  // У демонстраційній частині використовуємо його, як у методичці;
  // у власному варіанті — локатори за роллю/назвою.
  test('каталог містить шість товарів', async ({ page }) => {
    await expect(page.locator('.inventory_item')).toHaveCount(6);
  });

  test('сортування від дешевих до дорогих', async ({ page }) => {
    await page.getByTestId('product-sort-container').selectOption('lohi');
    await expect(page.locator('.inventory_item_price')).toHaveCount(6);
    // expect.poll очікує, поки DOM реально відобразить відсортовані ціни.
    await expect.poll(async () => {
      const textPrices = await page.locator('.inventory_item_price').allTextContents();
      if (textPrices.length !== 6) return false;
      const prices = textPrices.map((value) => Number(value.replace('$', '')));
      return prices.every((price, index) => index === 0 || price >= prices[index - 1]);
    }).toBe(true);
  });

  test('додавання Backpack оновлює лічильник кошика', async ({ page }) => {
    const badge = page.locator('.shopping_cart_badge');
    await expect(badge).toHaveCount(0);
    await page.locator('.inventory_item')
      .filter({ hasText: 'Sauce Labs Backpack' })
      .getByRole('button', { name: 'Add to cart' })
      .click();
    await expect(badge).toHaveText('1');
  });

  test('видалення Bike Light очищає лічильник кошика', async ({ page }) => {
    const item = page.locator('.inventory_item')
      .filter({ hasText: 'Sauce Labs Bike Light' });
    await item.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    await item.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
  });
});
