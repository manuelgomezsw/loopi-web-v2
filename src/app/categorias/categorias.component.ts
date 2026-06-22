import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { CategoriasService, Categoria, Subcategoria } from './categorias.service';
import { FilterBarComponent } from '../shared/components/filter-bar/filter-bar.component';
import { ListCardComponent } from '../shared/components/list-card/list-card.component';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../shared/components/status-badge/status-badge.component';
import { ActiveFilters, FilterDefinition } from '../shared/models/filter.model';
import { FilterStateService } from '../shared/services/filter-state.service';

const ROUTE_KEY = '/categorias';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterBarComponent,
    ListCardComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnDestroy {
  private readonly svc = inject(CategoriasService);
  private readonly filterState = inject(FilterStateService);
  private readonly destroy$ = new Subject<void>();

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');

  // Formulario de nueva categoría
  readonly nuevaCatNombre = signal('');
  readonly creandoCat = signal(false);
  readonly errorCrearCat = signal('');

  // Control de formularios inline de subcategorías por categoría
  readonly subcatFormVisible = signal<Record<number, boolean>>({});
  readonly subcatNombre = signal<Record<number, string>>({});
  readonly creandoSubcat = signal<Record<number, boolean>>({});
  readonly errorSubcat = signal<Record<number, string>>({});

  // Control de edición inline
  readonly editandoCat = signal<number | null>(null);
  readonly editCatNombre = signal('');
  readonly editandoSubcat = signal<number | null>(null);
  readonly editSubcatNombre = signal('');

  // Modal de confirmación de inactivación
  readonly modalVisible = signal(false);
  readonly modalCategoriaId = signal<number | null>(null);
  readonly modalSubcatsActivas = signal(0);
  readonly procesando = signal<Record<number, boolean>>({});

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

  private activeFilters: ActiveFilters = this.filterState.get(ROUTE_KEY) || { estado: 'activo' };

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

  // --- Crear categoría ---

  crearCategoria(): void {
    const nombre = this.nuevaCatNombre().trim();
    if (!nombre) {
      this.errorCrearCat.set('El nombre es obligatorio.');
      return;
    }
    this.creandoCat.set(true);
    this.errorCrearCat.set('');
    this.svc
      .crearCategoria(nombre)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.nuevaCatNombre.set('');
          this.mostrarToast('Categoría creada correctamente.', 'verde');
          this.cargar();
          this.creandoCat.set(false);
        },
        error: (err) => {
          const msg = err?.error?.error === 'nombre_duplicado'
            ? 'Ya existe una categoría con ese nombre.'
            : 'Error al crear la categoría.';
          this.errorCrearCat.set(msg);
          this.creandoCat.set(false);
        },
      });
  }

  // --- Edición inline de categoría ---

  activarEditCat(cat: Categoria): void {
    this.editandoCat.set(cat.id);
    this.editCatNombre.set(cat.nombre);
  }

  cancelarEditCat(): void {
    this.editandoCat.set(null);
    this.editCatNombre.set('');
  }

  guardarEditCat(id: number): void {
    const nombre = this.editCatNombre().trim();
    if (!nombre) return;
    this.svc
      .editarCategoria(id, nombre)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editandoCat.set(null);
          this.mostrarToast('Categoría actualizada.', 'verde');
          this.cargar();
        },
        error: (err) => {
          const msg = err?.error?.error === 'nombre_duplicado'
            ? 'Ya existe una categoría con ese nombre.'
            : 'Error al editar la categoría.';
          this.mostrarToast(msg, 'rojo', 5000);
        },
      });
  }

  // --- Inactivar / Reactivar categoría ---

  solicitarInactivarCategoria(id: number): void {
    this.svc
      .impactoCategoria(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.modalSubcatsActivas.set(resp.subcategorias_activas);
          this.modalCategoriaId.set(id);
          this.modalVisible.set(true);
        },
        error: () => this.mostrarToast('Error al consultar impacto.', 'rojo', 5000),
      });
  }

  confirmarInactivar(): void {
    const id = this.modalCategoriaId();
    if (!id) return;
    this.modalVisible.set(false);
    this.setProcesando(id, true);
    this.svc
      .inactivarCategoria(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.mostrarToast(
            `Categoría inactivada. ${resp.subcategorias_inactivadas} subcategoría(s) también inactivadas.`,
            'verde',
          );
          this.cargar();
          this.setProcesando(id, false);
        },
        error: () => {
          this.mostrarToast('Error al inactivar la categoría.', 'rojo', 5000);
          this.setProcesando(id, false);
        },
      });
  }

  cancelarModal(): void {
    this.modalVisible.set(false);
    this.modalCategoriaId.set(null);
  }

  reactivarCategoria(id: number): void {
    this.setProcesando(id, true);
    this.svc
      .reactivarCategoria(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mostrarToast('Categoría reactivada.', 'verde');
          this.cargar();
          this.setProcesando(id, false);
        },
        error: () => {
          this.mostrarToast('Error al reactivar la categoría.', 'rojo', 5000);
          this.setProcesando(id, false);
        },
      });
  }

  // --- Subcategorías ---

  toggleSubcatForm(catId: number): void {
    const current = this.subcatFormVisible();
    this.subcatFormVisible.set({ ...current, [catId]: !current[catId] });
    if (!this.subcatNombre()[catId]) {
      this.subcatNombre.set({ ...this.subcatNombre(), [catId]: '' });
    }
  }

  crearSubcategoria(catId: number): void {
    const nombre = (this.subcatNombre()[catId] || '').trim();
    if (!nombre) {
      this.errorSubcat.set({ ...this.errorSubcat(), [catId]: 'El nombre es obligatorio.' });
      return;
    }
    this.creandoSubcat.set({ ...this.creandoSubcat(), [catId]: true });
    this.errorSubcat.set({ ...this.errorSubcat(), [catId]: '' });
    this.svc
      .crearSubcategoria(nombre, catId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.subcatNombre.set({ ...this.subcatNombre(), [catId]: '' });
          this.subcatFormVisible.set({ ...this.subcatFormVisible(), [catId]: false });
          this.mostrarToast('Subcategoría creada correctamente.', 'verde');
          this.cargar();
          this.creandoSubcat.set({ ...this.creandoSubcat(), [catId]: false });
        },
        error: (err) => {
          const msg = err?.error?.error === 'nombre_duplicado'
            ? 'Ya existe esa subcategoría en esta categoría.'
            : err?.error?.error === 'categoria_padre_inactiva'
            ? 'La categoría está inactiva.'
            : 'Error al crear la subcategoría.';
          this.errorSubcat.set({ ...this.errorSubcat(), [catId]: msg });
          this.creandoSubcat.set({ ...this.creandoSubcat(), [catId]: false });
        },
      });
  }

  activarEditSubcat(sub: Subcategoria): void {
    this.editandoSubcat.set(sub.id);
    this.editSubcatNombre.set(sub.nombre);
  }

  cancelarEditSubcat(): void {
    this.editandoSubcat.set(null);
    this.editSubcatNombre.set('');
  }

  guardarEditSubcat(id: number): void {
    const nombre = this.editSubcatNombre().trim();
    if (!nombre) return;
    this.svc
      .editarSubcategoria(id, nombre)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editandoSubcat.set(null);
          this.mostrarToast('Subcategoría actualizada.', 'verde');
          this.cargar();
        },
        error: (err) => {
          const msg = err?.error?.error === 'nombre_duplicado'
            ? 'Ya existe esa subcategoría en esta categoría.'
            : 'Error al editar la subcategoría.';
          this.mostrarToast(msg, 'rojo', 5000);
        },
      });
  }

  inactivarSubcategoria(id: number): void {
    this.setProcesando(id, true);
    this.svc
      .inactivarSubcategoria(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mostrarToast('Subcategoría inactivada.', 'verde');
          this.cargar();
          this.setProcesando(id, false);
        },
        error: () => {
          this.mostrarToast('Error al inactivar la subcategoría.', 'rojo', 5000);
          this.setProcesando(id, false);
        },
      });
  }

  reactivarSubcategoria(id: number): void {
    this.setProcesando(id, true);
    this.svc
      .reactivarSubcategoria(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mostrarToast('Subcategoría reactivada.', 'verde');
          this.cargar();
          this.setProcesando(id, false);
        },
        error: (err) => {
          const msg = err?.error?.error === 'categoria_padre_inactiva'
            ? 'La categoría padre está inactiva. Reactívala primero.'
            : 'Error al reactivar la subcategoría.';
          this.mostrarToast(msg, 'rojo', 5000);
          this.setProcesando(id, false);
        },
      });
  }

  setSubcatNombre(catId: number, val: string): void {
    this.subcatNombre.set({ ...this.subcatNombre(), [catId]: val });
  }

  // --- Helpers ---

  private setProcesando(id: number, val: boolean): void {
    this.procesando.set({ ...this.procesando(), [id]: val });
  }

  mostrarToast(msg: string, tipo: 'verde' | 'rojo', duracion = 3000): void {
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    setTimeout(() => this.toastMsg.set(''), duracion);
  }
}
