import { Component, input } from '@angular/core';

@Component({
  selector: 'app-readonly-field',
  standalone: true,
  template: `
    <div>
      <p class="block text-sm font-medium text-gray-600 mb-1">{{ label() }}</p>
      <div class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border border-gray-200">
        <svg
          class="h-4 w-4 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <span class="text-sm text-gray-700 font-mono">{{ value() }}</span>
      </div>
    </div>
  `,
})
export class ReadonlyFieldComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
}
