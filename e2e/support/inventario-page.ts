import { Page, expect } from '@playwright/test';

export class InventarioPage {
  constructor(private page: Page) {}

  async navigateToConteo() {
    await this.page.goto('/inventario/conteo');
  }

  async navigateToHistorial() {
    await this.page.goto('/inventario/historial');
  }

  async waitForSuggestion() {
    await this.page.waitForLoadState('networkidle');
  }

  async getTipoValue() {
    return await this.page.locator('select#tipo').inputValue();
  }

  async getHorarioValue() {
    return await this.page.locator('select#horario').inputValue();
  }

  async setTipo(value: string) {
    await this.page.locator('select#tipo').selectOption(value);
  }

  async setHorario(value: string) {
    await this.page.locator('select#horario').selectOption(value);
  }

  async clickInitiateButton() {
    await this.page.locator('button:has-text("Iniciar Conteo")').click();
  }

  async enterItemValue(itemId: number, value: number) {
    const inputId = `valor-${itemId}`;
    await this.page.locator(`#${inputId}`).fill(value.toString());
    await this.page.locator(`#${inputId}`).blur();
  }

  async clickConfirmButton() {
    await this.page.locator('button:has-text("Continuar a Confirmación")').click();
  }

  async clickFinalConfirmButton() {
    await this.page.locator('button:has-text("Confirmar Conteo")').click();
  }

  async isOnStep(stepName: string) {
    const header = this.page.locator('app-page-header');
    return await header.locator(`[title*="${stepName}"]`).isVisible();
  }

  async waitForItemsToLoad() {
    await this.page.waitForSelector('input[id^="valor-"]', { timeout: 5000 });
  }

  async getItemCount() {
    return await this.page.locator('input[id^="valor-"]').count();
  }

  async hasError(errorText: string) {
    return await this.page.locator(`text=${errorText}`).isVisible();
  }

  async waitForCompletion() {
    await this.page.locator('text=Conteo Completado').waitFor({ state: 'visible' });
  }

  async getHistorialItemCount() {
    return await this.page.locator('[role="button"]').count();
  }

  async filterByType(tipo: string) {
    const button = this.page.locator('button', { hasText: tipo });
    await button.click();
  }

  async filterByStatus(estado: string) {
    const button = this.page.locator('button', { hasText: estado });
    await button.click();
  }
}
