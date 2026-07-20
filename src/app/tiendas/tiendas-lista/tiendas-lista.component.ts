import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { ListaTiendasResponse, TiendaResponse, TiendasService } from '../tiendas.service';
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
  selector: 'app-tiendas-lista',
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
  templateUrl: './tiendas-lista.component.html',
})
export class TiendasListaComponent {
  private readonly tiendasService = inject(TiendasService);
  protected readonly router = inject(Router);

  readonly tiendas = signal<TiendaResponse[]>([]);
  readonly total = signal<number>(0);
  readonly cargando = signal<boolean>(false);
  readonly errorMsg = signal<string>('');

  readonly toastMsg = signal<string>('');
  readonly toastTipo = signal<'verde' | 'neutro' | 'rojo'>('neutro');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly pagina = signal<number>(1);
  readonly limite = 50;

  private activeFilters: ActiveFilters = { estado: 'activo' };

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
  ];

  readonly cols: ColumnDef[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'codigo', label: 'Código' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'activo', label: 'Estado' },
  ];

  onFilters(filters: ActiveFilters): void {
    this.activeFilters = filters;
    this.pagina.set(1);
    this.cargarTiendas();
  }

  onPage(page: number): void {
    this.pagina.set(page);
    this.cargarTiendas();
  }

  irAEditar(id: number): void {
    this.router.navigate(['/tiendas', id, 'editar']);
  }

  cargarTiendas(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.tiendasService
      .listar(this.activeFilters['estado'] ?? 'activo', this.pagina(), this.limite)
      .subscribe({
        next: (resp: ListaTiendasResponse) => {
          this.tiendas.set(resp.datos);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar las tiendas. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  private mostrarToast(msg: string, tipo: 'verde' | 'neutro' | 'rojo', ms: number): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), ms);
  }
}
