import { test, expect } from '@playwright/test';
import { InventarioPage } from './support/inventario-page';
import { BlockingPage } from './support/blocking-page';

test.describe('HU5-HU7 - Bloqueo de Movimientos Durante Conteo Activo (RF-INV-05)', () => {
  let inventarioPage: InventarioPage;
  let blockingPage: BlockingPage;
  let activeCountId: number;

  test.beforeEach(async ({ page: playwright }) => {
    inventarioPage = new InventarioPage(playwright);
    blockingPage = new BlockingPage(playwright);

    // Iniciar conteo y obtener el ID
    await inventarioPage.navigateToConteo();
    await inventarioPage.clickInitiateButton();
    await inventarioPage.waitForItemsToLoad();

    // Extraer el ID del conteo activo de la URL o del estado
    activeCountId = 1; // Placeholder - en realidad se obtendría del backend
  });

  test('HU5: Should block compras when inventory count is active', async () => {
    // Verificar que el conteo está en progreso
    const itemCount = await inventarioPage.getItemCount();
    expect(itemCount).toBeGreaterThan(0);

    // Navegar a compras
    await blockingPage.navigateToCompras();
    await blockingPage.waitForInventoryStatus();

    // Verificar que se muestra banner de inventario activo
    await blockingPage.verifyInventoryActiveBanner();

    // Verificar que se muestra badge con detalles del conteo
    await blockingPage.verifyInventoryActiveBadge();
    await blockingPage.verifyCounterDetails();

    // Intentar guardar una compra
    await blockingPage.attemptToSaveMovimiento();

    // Verificar error 409 con código inventario_activo
    await blockingPage.verifyErrorToast('No se pueden registrar movimientos');
  });

  test('HU6: Should block mermas when inventory count is active', async () => {
    // Verificar que el conteo está en progreso
    const itemCount = await inventarioPage.getItemCount();
    expect(itemCount).toBeGreaterThan(0);

    // Navegar a mermas
    await blockingPage.navigateToMermas();
    await blockingPage.waitForInventoryStatus();

    // Verificar que se muestra banner de inventario activo
    await blockingPage.verifyInventoryActiveBanner();

    // Verificar badge y detalles
    await blockingPage.verifyInventoryActiveBadge();

    // Verificar que los inputs están deshabilitados o hay overlay
    await blockingPage.verifyDisableOverlay();

    // Intentar guardar una merma
    await blockingPage.attemptToSaveMovimiento();

    // Verificar error
    await blockingPage.verifyErrorToast('No se pueden registrar movimientos');
  });

  test('HU7: Should block venta batch file upload when inventory count is active', async () => {
    // Verificar que el conteo está en progreso
    const itemCount = await inventarioPage.getItemCount();
    expect(itemCount).toBeGreaterThan(0);

    // Navegar a venta batch
    await blockingPage.navigateToVentaBatch();
    await blockingPage.waitForInventoryStatus();

    // Verificar que file input está deshabilitado
    await blockingPage.verifyFileInputDisabled();

    // Verificar mensaje de bloqueo
    await blockingPage.verifyErrorToast('No se pueden procesar ventas');
  });

  test('HU7: Should enable venta batch file upload after count is confirmed', async () => {
    // Navegar a venta batch - verificar que está deshabilitado
    await blockingPage.navigateToVentaBatch();
    await blockingPage.waitForInventoryStatus();
    await blockingPage.verifyFileInputDisabled();

    // Navegar de vuelta a inventario para confirmar conteo
    await inventarioPage.navigateToConteo();

    // Confirmar el conteo
    await inventarioPage.clickConfirmButton();
    await inventarioPage.clickFinalConfirmButton();
    await inventarioPage.waitForCompletion();

    // Navegar nuevamente a venta batch
    await blockingPage.navigateToVentaBatch();
    await blockingPage.waitForInventoryStatus();

    // Verificar que file input ahora está habilitado
    await blockingPage.verifyFileInputEnabled();
  });

  test('HU5-HU7: Complete flow - Iniciar, Bloquear, Confirmar, Desbloquear', async ({
    page: playwright,
  }) => {
    // 1. Inventario está en progreso
    let itemCount = await inventarioPage.getItemCount();
    expect(itemCount).toBeGreaterThan(0);

    // 2. Navegar a compras - debe estar bloqueado
    await blockingPage.navigateToCompras();
    await blockingPage.waitForInventoryStatus();
    await blockingPage.verifyInventoryActiveBanner();

    // 3. Navegar a mermas - debe estar bloqueado
    await blockingPage.navigateToMermas();
    await blockingPage.waitForInventoryStatus();
    await blockingPage.verifyInventoryActiveBanner();

    // 4. Navegar a venta batch - file input deshabilitado
    await blockingPage.navigateToVentaBatch();
    await blockingPage.waitForInventoryStatus();
    await blockingPage.verifyFileInputDisabled();

    // 5. Confirmar conteo
    await inventarioPage.navigateToConteo();
    await inventarioPage.clickConfirmButton();
    await inventarioPage.clickFinalConfirmButton();
    await inventarioPage.waitForCompletion();

    // 6. Verificar que compras ya no está bloqueada
    await blockingPage.navigateToCompras();
    await blockingPage.waitForInventoryStatus();

    // Banner no debe estar visible
    const banner = playwright.locator('[data-testid="inventory-active-banner"]');
    await expect(banner).not.toBeVisible();

    // 7. Verificar que venta batch file input está habilitado
    await blockingPage.navigateToVentaBatch();
    await blockingPage.waitForInventoryStatus();
    await blockingPage.verifyFileInputEnabled();
  });
});
