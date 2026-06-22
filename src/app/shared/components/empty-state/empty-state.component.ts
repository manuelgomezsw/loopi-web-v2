import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="text-center py-16 text-gray-500">
      <p class="text-lg font-medium text-gray-700">{{ title() }}</p>
      @if (description()) {
        <p class="text-sm mt-1 text-gray-500">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button
          type="button"
          (click)="action.emit()"
          class="mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
