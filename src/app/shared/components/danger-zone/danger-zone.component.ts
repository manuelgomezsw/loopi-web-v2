import { Component, computed, inject, input } from '@angular/core';

import { FormModeService } from '../../services/form-mode.service';

@Component({
  selector: 'app-danger-zone',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="mt-8 border border-red-200 rounded-lg p-4 bg-red-50">
        <h3 class="text-sm font-semibold text-red-700 mb-3">{{ title() }}</h3>
        <ng-content />
      </div>
    }
  `,
})
export class DangerZoneComponent {
  readonly title = input<string>('Zona de peligro');

  private readonly formMode = inject(FormModeService, { optional: true });

  readonly visible = computed(() => this.formMode?.isEdit() ?? true);
}
