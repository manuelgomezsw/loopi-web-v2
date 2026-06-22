import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-card',
  standalone: true,
  template: `
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mx-auto"
      [class.max-w-sm]="size() === 'sm'"
      [class.max-w-xl]="size() === 'md'"
      [class.max-w-3xl]="size() === 'lg'"
    >
      <ng-content />
    </div>
  `,
})
export class FormCardComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
