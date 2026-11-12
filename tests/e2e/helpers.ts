import { expect, type Page } from '@playwright/test';
import { USERS } from './data';

export async function loginStandard(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill(USERS.standard.username);
  await page.getByPlaceholder('Password').fill(USERS.standard.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/inventory\.html(?:\?.*)?$/);
  await expect(page.getByText('Products', { exact: true })).toBeVisible();
}
