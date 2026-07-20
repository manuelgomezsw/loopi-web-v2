import { test, expect } from '@playwright/test';
import { InventarioPage } from './support/inventario-page';

test.describe('HU1 - Iniciar Conteo', () => {
  let page: InventarioPage;

  test.beforeEach(async ({ page: playwright }) => {
    page = new InventarioPage(playwright);
    await page.navigateToConteo();
  });

  test('should display automatic suggestion on load', async () => {
    await page.waitForSuggestion();

    const tipo = await page.getTipoValue();
    const horario = await page.getHorarioValue();

    expect(tipo).toBeTruthy();
    expect(['diario', 'semanal', 'mensual', 'inicial']).toContain(tipo);
  });

  test('should allow manual type selection', async () => {
    await page.setTipo('semanal');
    const tipo = await page.getTipoValue();
    expect(tipo).toBe('semanal');
  });

  test('should show horario field only for diario type', async ({ page: playwright }) => {
    const horarioField = playwright.locator('#horario').locator('..').first();

    await page.setTipo('semanal');
    await expect(horarioField).not.toBeVisible();

    await page.setTipo('diario');
    await expect(horarioField).toBeVisible();
  });

  test('should initiate count and load items', async () => {
    await page.clickInitiateButton();
    await page.waitForItemsToLoad();

    const itemCount = await page.getItemCount();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('should validate required fields', async ({ page: playwright }) => {
    await page.setTipo('');
    const submitButton = playwright.locator('button:has-text("Iniciar Conteo")');

    // Button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('should display error on API failure', async ({ page: playwright }) => {
    // Simulate API error by intercepting the request
    await playwright.route('**/api/v1/inventarios', route => {
      route.abort('failed');
    });

    await page.clickInitiateButton();
    const error = await page.hasError('Error');
    expect(error).toBe(true);
  });
});
