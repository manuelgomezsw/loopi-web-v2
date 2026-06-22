import {
  Component,
  computed,
  contentChildren,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { ColumnDef } from '../../models/filter.model';
import { AppCellTemplateDirective } from './cell-template.directive';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    @if (rows().length > 0) {
      <div class="overflow-x-auto rounded-lg border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              @for (col of columns(); track col.key) {
                <th
                  scope="col"
                  class="px-4 py-3 text-left font-medium text-gray-600"
                  [class]="col.width ?? ''"
                >
                  {{ col.label }}
                </th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            @for (row of rows(); track $any(row)[trackByField()]) {
              <tr
                class="hover:bg-gray-50 cursor-pointer transition-colors"
                [class.opacity-60]="isInactive(row)"
                (click)="rowClick.emit(row)"
              >
                @for (col of columns(); track col.key) {
                  <td class="px-4 py-3 text-gray-700">
                    @if (templateMap().has(col.key)) {
                      <ng-template
                        [ngTemplateOutlet]="templateMap().get(col.key)!"
                        [ngTemplateOutletContext]="{ $implicit: row }"
                      />
                    } @else {
                      {{ $any(row)[col.key] }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class DataTableComponent<T extends object> {
  readonly columns = input.required<ColumnDef[]>();
  readonly rows = input.required<T[]>();
  readonly trackByField = input<string>('id');
  readonly rowClick = output<T>();

  private readonly cellTemplates = contentChildren(AppCellTemplateDirective);

  readonly templateMap = computed(
    () => new Map(this.cellTemplates().map((d) => [d.appCellTemplate(), d.tpl])),
  );

  protected isInactive(row: T): boolean {
    return (row as Record<string, unknown>)['activo'] === false;
  }
}
