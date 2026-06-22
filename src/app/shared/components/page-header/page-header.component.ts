import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BreadcrumbItem } from '../../models/filter.model';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        @if (breadcrumb().length > 0) {
          <nav class="flex items-center gap-1 text-sm text-gray-500 mb-1">
            @for (crumb of breadcrumb(); track crumb.label; let last = $last) {
              @if (crumb.route && !last) {
                <a [routerLink]="crumb.route" class="hover:text-indigo-600">
                  {{ crumb.label }}
                </a>
                <span>/</span>
              } @else {
                <span [class.text-gray-800]="last" [class.font-medium]="last">
                  {{ crumb.label }}
                </span>
              }
            }
          </nav>
        }
        <h1 class="text-2xl font-semibold text-gray-800">{{ title() }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <ng-content select="[slot='actions']" />
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly breadcrumb = input<BreadcrumbItem[]>([]);
}
