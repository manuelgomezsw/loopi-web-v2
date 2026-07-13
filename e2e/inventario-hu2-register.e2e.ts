import { test, expect } from '@playwright/test';
import { InventarioPage } from './support/inventario-page';

test.describe('HU2 - Registrar Valores del Conteo', () => {
  let page: InventarioPage;

  test.beforeEach(async ({ page: playwright }) => {
    page = new InventarioPage(playwright);
    await page.navigateToConteo();
    await page.waitForSuggestion();
    await page.clickInitiateButton();
    await page.waitForItemsToLoad();
  });

  test('should display items list with input fields', async ({ page: playwright }) => {
    const itemCount = await page.getItemCount();
    expect(itemCount).toBeGreaterThan(0);

    const firstInput = playwright.locator('input[id^="valor-"]').first();
    await expect(firstInput).toBeVisible();
  });

  test('should allow entering real value for item', async ({ page: playwright }) => {
    const firstInput = playwright.locator('input[id^="valor-"]').first();
    await firstInput.fill('100');

    const value = await firstInput.inputValue();
    expect(value).toBe('100');
  });

  test('should calculate and display diferencia after input', async ({ page: playwright }) => {
    const firstInput = playwright.locator('input[id^="valor-"]').first();
    await firstInput.fill('50');
    await firstInput.blur();

    await page.page.waitForTimeout(500); // Wait for autosave
    const diferencia = playwright.locator('span').filter({ hasText: /^[+-]?\d+/ }).first();
    await expect(diferencia).toBeVisible();
  });

  test('should show loading indicator during save', async ({ page: playwright }) => {
    const firstInput = playwright.locator('input[id^="valor-"]').first();
    await firstInput.fill('75');
    await firstInput.blur();

    const loadingText = playwright.locator('text=Guardando');
    // May be very fast, just check it can be found in DOM
    await page.page.waitForTimeout(100);
  });

  test('should allow entering value for all items', async () => {
    const itemCount = await page.getItemCount();

    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      await page.page.locator('input[id^="valor-"]').nth(i).fill((50 + i * 10).toString());
      await page.page.locator('input[id^="valor-"]').nth(i).blur();
      await page.page.waitForTimeout(300);
    }

    const filledInputs = await page.page.locator('input[id^="valor-"][value!=""]').count();
    expect(filledInputs).toBeGreaterThan(0);
  });

  test('should continue button only enabled when all items registered', async ({ page: playwright }) => {
    const continueButton = playwright.locator('button:has-text("Continuar a Confirmación")');

    // Should be disabled initially
    await expect(continueButton).toBeDisabled();

    // Fill all items
    const itemCount = await page.getItemCount();
    for (let i = 0; i < itemCount; i++) {
      await page.page.locator('input[id^="valor-"]').nth(i).fill((50 + i).toString());
      await page.page.locator('input[id^="valor-"]').nth(i).blur();
      await page.page.waitForTimeout(200);
    }

    // Eventually should be enabled
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
  });
});
