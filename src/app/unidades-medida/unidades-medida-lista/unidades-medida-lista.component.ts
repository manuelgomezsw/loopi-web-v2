import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UnidadesMedidaService, UnidadMedida } from '../unidades-medida.service';
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
  selector: 'app-unidades-medida-lista',
  standalone: true,
  imports: [
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
  templateUrl: './unidades-medida-lista.component.html',
})
export class UnidadesMedidaListaComponent implements OnDestroy {
  private readonly svc = inject(UnidadesMedidaService);
  protected readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly unidades = signal<UnidadMedida[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');

  readonly pagina = signal(1);
  readonly limit = 50;

  private activeFilters: ActiveFilters = { estado: 'activo', tipo: 'todos' };

  readonly filterDefs: FilterDefinition[] = [
    {
      key: 'estado',
      defaultValue: 'activo',
      options: [
        { label: 'Activas', value: 'activo' },
        { label: 'Inactivas', value: 'inactivo' },
        { label: 'Todas', value: 'todos' },
      ],
    },
    {
      key: 'tipo',
      defaultValue: 'todos',
      options: [
        { label: 'Todos', value: 'todos' },
        { label: 'Peso', value: 'peso' },
        { label: 'Volumen', value: 'volumen' },
        { label: 'Unidad', value: 'unidad' },
      ],
    },
  ];

  readonly cols: ColumnDef[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo_medida', label: 'Tipo' },
    { key: 'factor_conversion', label: 'Factor' },
    { key: 'activo', label: 'Estado' },
  ];

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    const tipo = this.activeFilters['tipo'];
    this.svc
      .listar({
        page: this.pagina(),
        limit: this.limit,
        tipo: tipo && tipo !== 'todos' ? tipo : undefined,
        estado: this.activeFilters['estado'],
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.unidades.set(resp.unidades_medida);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar las unidades. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  irAEditar(id: number): void {
    this.router.navigate(['/unidades-medida', id, 'editar']);
  }

  mostrarToast(msg: string, tipo: 'verde' | 'rojo', duracion = 3000): void {
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    setTimeout(() => this.toastMsg.set(''), duracion);
  }
}
