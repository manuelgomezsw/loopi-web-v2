import { test, expect } from '@playwright/test';
import { InventarioPage } from './support/inventario-page';

test.describe('HU3 - Confirmar Conteo', () => {
  let page: InventarioPage;

  test.beforeEach(async ({ page: playwright }) => {
    page = new InventarioPage(playwright);
    await page.navigateToConteo();
    await page.waitForSuggestion();
    await page.clickInitiateButton();
    await page.waitForItemsToLoad();

    // Register all items
    const itemCount = await page.getItemCount();
    for (let i = 0; i < itemCount; i++) {
      await page.page.locator('input[id^="valor-"]').nth(i).fill((50 + i).toString());
      await page.page.locator('input[id^="valor-"]').nth(i).blur();
      await page.page.waitForTimeout(200);
    }

    await page.clickConfirmButton();
    await page.page.waitForLoadState('networkidle');
  });

  test('should display confirmation summary', async ({ page: playwright }) => {
    const summary = playwright.locator('text=Total de items');
    await expect(summary).toBeVisible();

    const tipoSummary = playwright.locator('text=Tipo de conteo');
    await expect(tipoSummary).toBeVisible();
  });

  test('should complete count on confirmation', async () => {
    await page.clickFinalConfirmButton();
    await page.waitForCompletion();

    const completionMessage = await page.page.locator('text=Conteo Completado').isVisible();
    expect(completionMessage).toBe(true);
  });

  test('should show completion timestamp', async ({ page: playwright }) => {
    await page.clickFinalConfirmButton();
    await page.waitForCompletion();

    const timestamp = playwright.locator('text=Completado:');
    await expect(timestamp).toBeVisible();
  });

  test('should show "Nuevo Conteo" button after completion', async ({ page: playwright }) => {
    await page.clickFinalConfirmButton();
    await page.waitForCompletion();

    const newButton = playwright.locator('button:has-text("Nuevo Conteo")');
    await expect(newButton).toBeVisible();
  });

  test('should handle missing items error', async ({ page: playwright }) => {
    // Go back and remove one value
    await page.page.locator('button:has-text("Volver")').click();
    await page.page.waitForLoadState('networkidle');

    const firstInput = page.page.locator('input[id^="valor-"]').first();
    await firstInput.fill('');
    await firstInput.blur();
    await page.page.waitForTimeout(300);

    await page.clickConfirmButton();
    await page.page.waitForLoadState('networkidle');
    await page.clickFinalConfirmButton();

    const errorMessage = await page.hasError('Items pendientes');
    // Error should appear or form should reject
    const confirmationError = page.page.locator('[role="alert"]');
    const isVisible = await confirmationError.isVisible().catch(() => false);
    expect(isVisible || errorMessage).toBe(true);
  });
});
