import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CategoriasService, Categoria } from './categorias.service';
import { CategoriaCardComponent } from './components/categoria-card/categoria-card.component';
import { FilterBarComponent } from '../shared/components/filter-bar/filter-bar.component';
import { ListCardComponent } from '../shared/components/list-card/list-card.component';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { ActiveFilters, FilterDefinition } from '../shared/models/filter.model';
import { FilterStateService } from '../shared/services/filter-state.service';

const ROUTE_KEY = '/categorias';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    RouterModule,
    CategoriaCardComponent,
    FilterBarComponent,
    ListCardComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnDestroy {
  readonly router = inject(Router);
  private readonly svc = inject(CategoriasService);
  private readonly filterState = inject(FilterStateService);
  private readonly destroy$ = new Subject<void>();

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');

  readonly filters: FilterDefinition[] = [
    {
      key: 'estado',
      defaultValue: 'activo',
      options: [
        { label: 'Activas', value: 'activo' },
        { label: 'Inactivas', value: 'inactivo' },
        { label: 'Todas', value: 'todos' },
      ],
    },
  ];

  private activeFilters: ActiveFilters = this.filterState.get(ROUTE_KEY) ?? { estado: 'activo' };

  constructor() {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilters(filters: ActiveFilters): void {
    this.activeFilters = filters;
    this.filterState.set(ROUTE_KEY, filters);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.svc
      .obtenerCatalogo(this.activeFilters['estado'] as string)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.categorias.set(resp.categorias);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar el catálogo. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }
}
