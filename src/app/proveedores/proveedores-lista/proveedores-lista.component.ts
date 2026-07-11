import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { ProveedoresService, Proveedor } from '../proveedores.service';
import { ActiveFilters, ColumnDef, FilterDefinition } from '../../shared/models/filter.model';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ListCardComponent } from '../../shared/components/list-card/list-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AppCellTemplateDirective } from '../../shared/components/data-table/cell-template.directive';

@Component({
  selector: 'app-proveedores-lista',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    FilterBarComponent,
    DataTableComponent,
    PaginationComponent,
    PageHeaderComponent,
    ListCardComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    AppCellTemplateDirective,
  ],
  templateUrl: './proveedores-lista.component.html',
})
export class ProveedoresListaComponent implements OnInit, OnDestroy {
  private readonly svc = inject(ProveedoresService);
  protected readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly busqueda$ = new Subject<string>();

  readonly proveedores = signal<Proveedor[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly busqueda = signal('');

  readonly pagina = signal(1);
  readonly limit = 50;

  private activeFilters: ActiveFilters = { estado: 'activo' };

  readonly filterDefs: FilterDefinition[] = [
    {
      key: 'estado',
      defaultValue: 'activo',
      options: [
        { label: 'Activos', value: 'activo' },
        { label: 'Inactivos', value: 'inactivo' },
        { label: 'Todos', value: 'todos' },
      ],
    },
  ];

  readonly cols: ColumnDef[] = [
    { key: 'razon_social', label: 'Razón social' },
    { key: 'nit', label: 'NIT' },
    { key: 'nombre_contacto', label: 'Contacto' },
    { key: 'activo', label: 'Estado' },
  ];

  ngOnInit(): void {
    this.busqueda$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pagina.set(1);
        this.cargar();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBusqueda(q: string): void {
    this.busqueda.set(q);
    this.busqueda$.next(q);
  }

  onFilters(filters: ActiveFilters): void {
    this.activeFilters = filters;
    this.pagina.set(1);
    this.cargar();
  }

  onPage(page: number): void {
    this.pagina.set(page);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.svc
      .listar({
        busqueda: this.busqueda(),
        estado: this.activeFilters['estado'],
        page: this.pagina(),
        limit: this.limit,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.proveedores.set(resp.proveedores);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar los proveedores. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  irAEditar(id: number): void {
    this.router.navigate(['/proveedores', id, 'editar']);
  }
}
