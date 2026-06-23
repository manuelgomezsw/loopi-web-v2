import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CategoriasService, Categoria, Subcategoria } from '../categorias.service';
import { FormModeService } from '../../shared/services/form-mode.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormCardComponent } from '../../shared/components/form-card/form-card.component';
import { DangerZoneComponent } from '../../shared/components/danger-zone/danger-zone.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    PageHeaderComponent,
    FormCardComponent,
    DangerZoneComponent,
    StatusBadgeComponent,
  ],
  providers: [FormModeService],
  templateUrl: './categoria-form.component.html',
})
export class CategoriaFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(CategoriasService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formMode = inject(FormModeService);
  private readonly destroy$ = new Subject<void>();

  readonly modoEdicion = this.formMode.isEdit;
  readonly categoria = signal<Categoria | null>(null);
  readonly subcategorias = signal<Subcategoria[]>([]);
  readonly guardando = signal(false);
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Estado de edición inline de subcategorías
  readonly editandoSubcat = signal<number | null>(null);
  readonly editSubcatNombre = signal('');
  readonly subcatFormVisible = signal(false);
  readonly nuevaSubcatNombre = signal('');
  readonly creandoSubcat = signal(false);
  readonly errorNuevaSubcat = signal('');
  readonly procesando = signal<Record<number, boolean>>({});

  // Modal inactivación de categoría
  readonly modalVisible = signal(false);
  readonly modalSubcatsActivas = signal(0);
  readonly inactivando = signal(false);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.formMode.mode.set('edit');
      this.cargarCategoria(Number(idParam));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private cargarCategoria(id: number): void {
    this.svc
      .obtenerCatalogo('todos')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const cat = resp.categorias.find((c) => c.id === id) ?? null;
          this.categoria.set(cat);
          if (cat) {
            this.subcategorias.set(cat.subcategorias);
            this.form.patchValue({ nombre: cat.nombre });
          }
        },
        error: () => this.mostrarToast('Error al cargar la categoría.', 'rojo', 5000),
      });
  }

  enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const nombre = this.form.get('nombre')!.value as string;
    this.guardando.set(true);

    if (this.modoEdicion()) {
      const id = this.categoria()!.id;
      this.svc
        .editarCategoria(id, nombre)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.mostrarToast('Categoría actualizada correctamente.', 'verde');
            setTimeout(() => this.router.navigate(['/categorias']), 1500);
          },
          error: (err) => {
            this.guardando.set(false);
            const msg =
              err?.error?.error === 'nombre_duplicado'
                ? 'Ya existe una categoría con ese nombre.'
                : 'Error al actualizar la categoría.';
            this.mostrarToast(msg, 'rojo', 5000);
          },
        });
    } else {
      this.svc
        .crearCategoria(nombre)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.mostrarToast('Categoría creada correctamente.', 'verde');
            setTimeout(() => this.router.navigate(['/categorias']), 1500);
          },
          error: (err) => {
            this.guardando.set(false);
            const msg =
              err?.error?.error === 'nombre_duplicado'
                ? 'Ya existe una categoría con ese nombre.'
                : 'Error al crear la categoría.';
            this.mostrarToast(msg, 'rojo', 5000);
          },
        });
    }
  }

  // --- Subcategorías ---

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
    this.setProcesando(id, true);
    this.svc
      .editarSubcategoria(id, nombre)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sub) => {
          this.editandoSubcat.set(null);
          this.subcategorias.update((list) =>
            list.map((s) => (s.id === id ? sub : s)),
          );
          this.mostrarToast('Subcategoría actualizada.', 'verde');
          this.setProcesando(id, false);
        },
        error: (err) => {
          const msg =
            err?.error?.error === 'nombre_duplicado'
              ? 'Ya existe esa subcategoría en esta categoría.'
              : 'Error al actualizar la subcategoría.';
          this.mostrarToast(msg, 'rojo', 5000);
          this.setProcesando(id, false);
        },
      });
  }

  crearSubcategoria(): void {
    const nombre = this.nuevaSubcatNombre().trim();
    if (!nombre) {
      this.errorNuevaSubcat.set('El nombre es obligatorio.');
      return;
    }
    const catId = this.categoria()!.id;
    this.creandoSubcat.set(true);
    this.errorNuevaSubcat.set('');
    this.svc
      .crearSubcategoria(nombre, catId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sub) => {
          this.subcategorias.update((list) => [...list, sub]);
          this.nuevaSubcatNombre.set('');
          this.subcatFormVisible.set(false);
          this.mostrarToast('Subcategoría creada correctamente.', 'verde');
          this.creandoSubcat.set(false);
        },
        error: (err) => {
          const msg =
            err?.error?.error === 'nombre_duplicado'
              ? 'Ya existe esa subcategoría en esta categoría.'
              : 'Error al crear la subcategoría.';
          this.errorNuevaSubcat.set(msg);
          this.creandoSubcat.set(false);
        },
      });
  }

  inactivarSubcategoria(id: number): void {
    this.setProcesando(id, true);
    this.svc
      .inactivarSubcategoria(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sub) => {
          this.subcategorias.update((list) =>
            list.map((s) => (s.id === id ? sub : s)),
          );
          this.mostrarToast('Subcategoría desactivada.', 'verde');
          this.setProcesando(id, false);
        },
        error: () => {
          this.mostrarToast('Error al desactivar la subcategoría.', 'rojo', 5000);
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
        next: (sub) => {
          this.subcategorias.update((list) =>
            list.map((s) => (s.id === id ? sub : s)),
          );
          this.mostrarToast('Subcategoría reactivada.', 'verde');
          this.setProcesando(id, false);
        },
        error: (err) => {
          const msg =
            err?.error?.error === 'categoria_padre_inactiva'
              ? 'Reactiva la categoría primero.'
              : 'Error al reactivar la subcategoría.';
          this.mostrarToast(msg, 'rojo', 5000);
          this.setProcesando(id, false);
        },
      });
  }

  // --- Inactivar / Reactivar categoría ---

  solicitarInactivar(): void {
    this.svc
      .impactoCategoria(this.categoria()!.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.modalSubcatsActivas.set(resp.subcategorias_activas);
          this.modalVisible.set(true);
        },
        error: () => this.mostrarToast('Error al consultar el impacto.', 'rojo', 5000),
      });
  }

  cancelarModal(): void {
    this.modalVisible.set(false);
  }

  confirmarInactivar(): void {
    this.inactivando.set(true);
    this.svc
      .inactivarCategoria(this.categoria()!.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.inactivando.set(false);
          this.modalVisible.set(false);
          this.mostrarToast('Categoría desactivada.', 'verde');
          setTimeout(() => this.router.navigate(['/categorias']), 1500);
        },
        error: () => {
          this.inactivando.set(false);
          this.modalVisible.set(false);
          this.mostrarToast('Error al desactivar la categoría.', 'rojo', 5000);
        },
      });
  }

  reactivarCategoria(): void {
    this.svc
      .reactivarCategoria(this.categoria()!.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cat) => {
          this.categoria.set(cat);
          this.mostrarToast('Categoría reactivada.', 'verde');
        },
        error: () => this.mostrarToast('Error al reactivar la categoría.', 'rojo', 5000),
      });
  }

  errorDe(campo: string): string {
    const ctrl = this.form.get(campo);
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    return '';
  }

  private setProcesando(id: number, val: boolean): void {
    this.procesando.update((m) => ({ ...m, [id]: val }));
  }

  mostrarToast(msg: string, tipo: 'verde' | 'rojo', duracion = 3000): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), duracion);
  }
}
