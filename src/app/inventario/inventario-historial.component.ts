import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService, InventarioResp } from './inventario.service';
import { AuthService } from '../auth/auth.service';
import { ActiveFilters, FilterDefinition } from '../shared/models/filter.model';
import { ListCardComponent } from '../shared/components/list-card/list-card.component';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { FilterBarComponent } from '../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../shared/components/icon/icon.component';

@Component({
  selector: 'app-inventario-historial',
  templateUrl: './inventario-historial.component.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ListCardComponent,
    PageHeaderComponent,
    FilterBarComponent,
    PaginationComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    IconComponent
  ]
})
export class InventarioHistorialComponent implements OnInit {
  readonly inventarios = signal<InventarioResp[]>([]);
  readonly total = signal(0);
  readonly paginaActual = signal(1);
  readonly totalPaginas = signal(1);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly userRole = signal<string | null>(null);

  readonly filtros = signal({
    tipo: '',
    estado: '',
    desde: '',
    hasta: ''
  });

  readonly filterDefs: FilterDefinition[] = [
    {
      key: 'tipo',
      defaultValue: null,
      options: [
        { label: 'Diario', value: 'diario' },
        { label: 'Semanal', value: 'semanal' },
        { label: 'Mensual', value: 'mensual' },
        { label: 'Inicial', value: 'inicial' },
      ],
    },
    {
      key: 'estado',
      defaultValue: null,
      options: [
        { label: 'En progreso', value: 'en_progreso' },
        { label: 'Completado', value: 'completado' },
      ],
    },
  ];

  constructor(
    private inventarioService: InventarioService,
    readonly router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userRole.set(this.authService.sesion()?.rol || null);
    this.cargarHistorial();
  }

  onFilters(filters: ActiveFilters): void {
    const filtrosActuales = this.filtros();
    this.filtros.set({
      tipo: filters['tipo'] || '',
      estado: filters['estado'] || '',
      desde: filtrosActuales.desde,
      hasta: filtrosActuales.hasta,
    });
    this.paginaActual.set(1);
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.errorMsg.set('');

    const filtrosActuales = this.filtros();
    const filtrosObj: Record<string, string | number> = {
      pagina: this.paginaActual(),
      por_pagina: 50
    };

    if (filtrosActuales.tipo) filtrosObj['tipo'] = filtrosActuales.tipo;
    if (filtrosActuales.estado) filtrosObj['estado'] = filtrosActuales.estado;
    if (filtrosActuales.desde) filtrosObj['desde'] = filtrosActuales.desde;
    if (filtrosActuales.hasta) filtrosObj['hasta'] = filtrosActuales.hasta;

    this.inventarioService.getHistorial(filtrosObj).subscribe({
      next: (data) => {
        this.inventarios.set(data.inventarios);
        this.total.set(data.total);
        this.totalPaginas.set(data.total_paginas);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.mensaje || 'Error al cargar historial');
        this.cargando.set(false);
      }
    });
  }

  verDetalle(inventarioId: number): void {
    this.router.navigate(['/inventario/detalle', inventarioId]);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.cargarHistorial();
    }
  }

  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargarHistorial();
  }

  limpiarFiltros(): void {
    this.filtros.set({ tipo: '', estado: '', desde: '', hasta: '' });
    this.paginaActual.set(1);
    this.cargarHistorial();
  }

  actualizarFiltro(key: string, value: string): void {
    const filtrosActuales = this.filtros();
    this.filtros.set({ ...filtrosActuales, [key]: value });
  }

  puedeEliminar(inventario: InventarioResp): boolean {
    return this.userRole() === 'admin' && inventario.estado === 'en_progreso';
  }

  eliminarConteo(inventario: InventarioResp): void {
    if (!this.puedeEliminar(inventario)) return;

    if (confirm('¿Estás seguro de que deseas eliminar este conteo? Esta acción no se puede deshacer.')) {
      this.inventarioService.eliminarConteo(inventario.id).subscribe({
        next: () => {
          const actuales = this.inventarios();
          this.inventarios.set(actuales.filter(inv => inv.id !== inventario.id));
          this.total.update(t => t - 1);
        },
        error: (err) => {
          this.errorMsg.set(err?.error?.mensaje || 'Error al eliminar conteo');
        }
      });
    }
  }
}
