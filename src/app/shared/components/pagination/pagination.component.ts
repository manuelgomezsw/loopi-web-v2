import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between px-2 py-3 border-t border-gray-200 mt-2">
        <p class="text-sm text-gray-600">
          Página <span class="font-medium">{{ page() }}</span> de
          <span class="font-medium">{{ totalPages() }}</span>
          &nbsp;·&nbsp;{{ total() }} registros
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
            class="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <button
            type="button"
            [disabled]="page() >= totalPages()"
            (click)="pageChange.emit(page() + 1)"
            class="px-3 py-1 rounded border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input<number>(20);
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  readonly totalPages = computed(() =>
    Math.ceil(this.total() / this.pageSize()),
  );
}
