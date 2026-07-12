import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { Item, ItemsService } from '../items.service';
import { AuthService } from '../../auth/auth.service';
import { ActiveFilters, ColumnDef, FilterDefinition } from '../../shared/models/filter.model';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ListCardComponent } from '../../shared/components/list-card/list-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AppCellTemplateDirective } from '../../shared/components/data-table/cell-template.directive';

const TIPO_LABELS: Record<string, string> = {
  insumo: 'Insumo',
  material_consumo: 'Material de consumo',
  activo: 'Activo',
};

const FRECUENCIA_LABELS: Record<string, string> = {
  diario: 'Diario',
  semanal: 'Semanal',
  mensual: 'Mensual',
};

@Component({
  selector: 'app-items-lista',
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
  templateUrl: './items-lista.component.html',
})
export class ItemsListaComponent {
  private readonly svc = inject(ItemsService);
  private readonly auth = inject(AuthService);
  protected readonly router = inject(Router);

  readonly esAdmin = () => this.auth.sesion()?.rol === 'admin';

  readonly items = signal<Item[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');

  readonly itemSeleccionado = signal<Item | null>(null);
  readonly mostrarModalCambioEstado = signal(false);
  readonly cambiandoEstado = signal(false);

  readonly pagina = signal(1);
  readonly porPagina = 50;

  private activeFilters: ActiveFilters = { tipo: 'todos', frecuencia: 'todos', estado: 'activo' };

  readonly filterDefs: FilterDefinition[] = [
    {
      key: 'tipo',
      defaultValue: 'todos',
      options: [
        { label: 'Todos los tipos', value: 'todos' },
        { label: 'Insumo', value: 'insumo' },
        { label: 'Material de consumo', value: 'material_consumo' },
        { label: 'Activo', value: 'activo' },
      ],
    },
    {
      key: 'frecuencia',
      defaultValue: 'todos',
      options: [
        { label: 'Todas las frecuencias', value: 'todos' },
        { label: 'Diario', value: 'diario' },
        { label: 'Semanal', value: 'semanal' },
        { label: 'Mensual', value: 'mensual' },
      ],
    },
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
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'frecuencia_inventario', label: 'Frecuencia' },
    { key: 'activo', label: 'Estado' },
    { key: 'acciones', label: '' },
  ];

  // El primer disparo de datos llega vía (filtersChange) de app-filter-bar en el template.

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
    const frecuencia = this.activeFilters['frecuencia'];
    const estado = this.activeFilters['estado'];
    this.svc
      .listarItems({
        tipo: tipo && tipo !== 'todos' ? tipo : undefined,
        frecuencia: frecuencia && frecuencia !== 'todos' ? frecuencia : undefined,
        activo: estado === 'todos' ? undefined : estado === 'activo',
        pagina: this.pagina(),
        por_pagina: this.porPagina,
      })
      .subscribe({
        next: (resp) => {
          this.items.set(resp.items);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar los items. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  irADetalle(id: number): void {
    this.router.navigate(['/items', id]);
  }

  solicitarCambioEstado(item: Item, event: Event): void {
    event.stopPropagation();
    this.itemSeleccionado.set(item);
    this.mostrarModalCambioEstado.set(true);
  }

  cancelarCambioEstado(): void {
    this.mostrarModalCambioEstado.set(false);
    this.itemSeleccionado.set(null);
  }

  confirmarCambioEstado(): void {
    const item = this.itemSeleccionado();
    if (!item) return;
    this.cambiandoEstado.set(true);
    const accion$ = item.activo ? this.svc.inactivarItem(item.id) : this.svc.reactivarItem(item.id);
    accion$.subscribe({
      next: () => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        this.itemSeleccionado.set(null);
        this.cargar();
      },
      error: () => {
        this.cambiandoEstado.set(false);
        this.mostrarModalCambioEstado.set(false);
        this.errorMsg.set('Error al cambiar el estado del item.');
      },
    });
  }

  labelTipo(tipo: string): string {
    return TIPO_LABELS[tipo] ?? tipo;
  }

  labelFrecuencia(frecuencia: string): string {
    return FRECUENCIA_LABELS[frecuencia] ?? frecuencia;
  }
}
