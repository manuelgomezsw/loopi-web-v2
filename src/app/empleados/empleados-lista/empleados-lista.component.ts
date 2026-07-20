import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { Empleado, EmpleadosService } from '../empleados.service';
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
  selector: 'app-empleados-lista',
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
  templateUrl: './empleados-lista.component.html',
})
export class EmpleadosListaComponent implements OnInit, OnDestroy {
  private readonly svc = inject(EmpleadosService);
  protected readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly busqueda$ = new Subject<string>();

  readonly empleados = signal<Empleado[]>([]);
  readonly total = signal<number>(0);
  readonly cargando = signal<boolean>(false);
  readonly errorMsg = signal<string>('');
  readonly toastMsg = signal<string>('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');

  readonly pagina = signal<number>(1);
  readonly limit = 20;
  readonly busqueda = signal<string>('');

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
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'rol', label: 'Rol' },
    { key: 'tienda_id', label: 'Tienda' },
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
        q: this.busqueda(),
        estado: this.activeFilters['estado'],
        page: this.pagina(),
        limit: this.limit,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.empleados.set(resp.empleados);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar los empleados. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  irAEditar(id: number): void {
    this.router.navigate(['/empleados', id, 'editar']);
  }

  mostrarToast(msg: string, tipo: 'verde' | 'rojo', duracion = 3000): void {
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    setTimeout(() => this.toastMsg.set(''), duracion);
  }
}
