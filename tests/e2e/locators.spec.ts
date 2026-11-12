import { test, expect } from '@playwright/test';

test('ЛР6 — перевірка п’яти локаторів Username', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  const locators = [
    { name: '1. Role', locator: page.getByRole('textbox', { name: 'Username' }) },
    { name: '2. Placeholder', locator: page.getByPlaceholder('Username') },
    { name: '3. Test ID', locator: page.locator('[data-test="username"]') },
    { name: '4. CSS', locator: page.locator('#user-name') },
    { name: '5. XPath', locator: page.locator('//input[@data-test="username"]') },
  ];

  for (const item of locators) {
    await expect(item.locator).toHaveCount(1);
    await expect(item.locator).toBeVisible();
    console.log(`PASS: ${item.name}`);
  }
});
