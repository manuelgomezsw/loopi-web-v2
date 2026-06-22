import { Component, OnInit, inject, input, output, signal } from '@angular/core';

import { ActiveFilters, FilterDefinition } from '../../models/filter.model';
import { FilterStateService } from '../../services/filter-state.service';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-3 mb-4">
      @for (filter of filters(); track filter.key) {
        @if (filter.defaultValue !== null) {
          <div class="flex gap-1">
            @for (opt of filter.options; track opt.value) {
              <button
                type="button"
                (click)="select(filter.key, opt.value)"
                class="px-3 py-1 rounded-full text-sm border capitalize transition-colors"
                [class.bg-indigo-600]="activeFilters()[filter.key] === opt.value"
                [class.text-white]="activeFilters()[filter.key] === opt.value"
                [class.border-indigo-600]="activeFilters()[filter.key] === opt.value"
                [class.border-gray-300]="activeFilters()[filter.key] !== opt.value"
                [class.text-gray-600]="activeFilters()[filter.key] !== opt.value"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        }
      }
    </div>
  `,
})
export class FilterBarComponent implements OnInit {
  private readonly filterState = inject(FilterStateService);

  readonly filters = input.required<FilterDefinition[]>();
  readonly routeKey = input.required<string>();
  readonly filtersChange = output<ActiveFilters>();

  protected readonly activeFilters = signal<ActiveFilters>({});

  ngOnInit(): void {
    const stored = this.filterState.get(this.routeKey());
    const defaults = this.buildDefaults();
    const merged = { ...defaults, ...stored };
    this.activeFilters.set(merged);
    this.filtersChange.emit(merged);
  }

  select(key: string, value: string): void {
    const updated = { ...this.activeFilters(), [key]: value };
    this.activeFilters.set(updated);
    this.filterState.set(this.routeKey(), updated);
    this.filtersChange.emit(updated);
  }

  private buildDefaults(): ActiveFilters {
    const defaults: ActiveFilters = {};
    for (const f of this.filters()) {
      if (f.defaultValue !== null) {
        defaults[f.key] = f.defaultValue;
      }
    }
    return defaults;
  }
}
