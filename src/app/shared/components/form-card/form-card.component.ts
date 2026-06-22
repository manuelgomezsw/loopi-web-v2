import { Component, OnChanges, inject, input } from '@angular/core';

import { FormMode } from '../../models/filter.model';
import { FormModeService } from '../../services/form-mode.service';

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
  providers: [FormModeService],
})
export class FormCardComponent implements OnChanges {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly mode = input<FormMode>('create');

  private readonly formMode = inject(FormModeService);

  ngOnChanges(): void {
    this.formMode.mode.set(this.mode());
  }
}
