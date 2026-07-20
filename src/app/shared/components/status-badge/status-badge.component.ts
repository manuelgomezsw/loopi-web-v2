import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      [class.bg-green-100]="activo()"
      [class.text-green-800]="activo()"
      [class.bg-gray-100]="!activo()"
      [class.text-gray-600]="!activo()"
    >
      {{ activo() ? 'Activo' : 'Inactivo' }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly activo = input.required<boolean>();
}
