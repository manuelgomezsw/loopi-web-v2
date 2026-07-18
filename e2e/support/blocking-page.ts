import { Page, expect } from '@playwright/test';

export class BlockingPage {
  constructor(private page: Page) {}

  // Selectors para elementos relacionados con bloqueo de inventario
  private inventoryActiveBannerSelector = '[data-testid="inventory-active-banner"]';
  private inventoryActiveBadgeSelector = '[data-testid="inventory-active-badge"]';
  private fileInputSelector = 'input[type="file"]';
  private disableOverlaySelector = '[data-testid="disable-overlay"]';

  async navigateToCompras() {
    await this.page.goto('/compras');
  }

  async navigateToMermas() {
    await this.page.goto('/mermas');
  }

  async navigateToVentaBatch() {
    await this.page.goto('/pos/ventas-batch');
  }

  async verifyInventoryActiveBanner() {
    const banner = this.page.locator(this.inventoryActiveBannerSelector);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Hay un conteo en progreso');
  }

  async verifyInventoryActiveBadge() {
    const badge = this.page.locator(this.inventoryActiveBadgeSelector);
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Inventario activo');
  }

  async verifyFileInputDisabled() {
    const fileInput = this.page.locator(this.fileInputSelector);
    await expect(fileInput).toBeDisabled();
  }

  async verifyFileInputEnabled() {
    const fileInput = this.page.locator(this.fileInputSelector);
    await expect(fileInput).toBeEnabled();
  }

  async verifyDisableOverlay() {
    const overlay = this.page.locator(this.disableOverlaySelector);
    await expect(overlay).toBeVisible();
  }

  async attemptToSaveMovimiento() {
    const saveButton = this.page.locator('button:has-text("Guardar")');
    await saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async verifyErrorToast(errorMessage: string) {
    const errorToast = this.page.locator(`text="${errorMessage}"`);
    await expect(errorToast).toBeVisible();
  }

  async verifyCounterDetails(expectedResponsable?: string) {
    const counterCard = this.page.locator('[data-testid="counter-details-card"]');
    await expect(counterCard).toBeVisible();

    if (expectedResponsable) {
      await expect(counterCard).toContainText(expectedResponsable);
    }
  }

  async waitForInventoryStatus() {
    await this.page.waitForLoadState('networkidle');
  }
}
