import { Component, inject, input, output, signal } from '@angular/core';

import { CategoriasService, Categoria, Subcategoria } from '../../categorias.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-categoria-card',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './categoria-card.component.html',
})
export class CategoriaCardComponent {
  private readonly svc = inject(CategoriasService);

  readonly categoria = input.required<Categoria>();
  readonly catalogoModificado = output<void>();

  // ─── Quick-add subcategoría ────────────────────────────────────────────────
  readonly subcatFormVisible = signal(false);
  readonly nuevoNombre = signal('');
  readonly guardando = signal(false);
  readonly errorMsg = signal('');

  // ─── Modal: renombrar categoría ───────────────────────────────────────────
  readonly modalCatVisible = signal(false);
  readonly editCatNombre = signal('');
  readonly guardandoCat = signal(false);
  readonly errorCatNombre = signal('');

  // ─── Modal: confirmar desactivación de categoría ──────────────────────────
  readonly modalDesactivarCatVisible = signal(false);
  readonly subcatsActivasCount = signal(0);
  readonly desactivandoCat = signal(false);

  // ─── Reactivar categoría (acción directa desde la tarjeta) ────────────────
  readonly procesandoCatEstado = signal(false);

  // ─── Modal: gestión de subcategoría (renombrar + activar/desactivar) ──────
  readonly modalSubcatVisible = signal(false);
  readonly subcatActual = signal<Subcategoria | null>(null);
  readonly editSubcatNombre = signal('');
  readonly guardandoSubcatNombre = signal(false);
  readonly errorSubcatNombre = signal('');
  readonly procesandoSubcatEstado = signal(false);

  // ── Categoría: renombrar ──────────────────────────────────────────────────

  abrirModalCat(): void {
    this.editCatNombre.set(this.categoria().nombre);
    this.errorCatNombre.set('');
    this.modalCatVisible.set(true);
  }

  cerrarModalCat(): void {
    this.modalCatVisible.set(false);
    this.editCatNombre.set('');
    this.errorCatNombre.set('');
  }

  guardarNombreCat(): void {
    const nombre = this.editCatNombre().trim();
    if (!nombre) { this.errorCatNombre.set('El nombre es obligatorio.'); return; }
    if (nombre === this.categoria().nombre) { this.cerrarModalCat(); return; }
    this.guardandoCat.set(true);
    this.errorCatNombre.set('');
    this.svc.editarCategoria(this.categoria().id, nombre).subscribe({
      next: () => { this.guardandoCat.set(false); this.cerrarModalCat(); this.catalogoModificado.emit(); },
      error: (err) => {
        this.guardandoCat.set(false);
        this.errorCatNombre.set(
          err?.error?.error === 'nombre_duplicado'
            ? 'Ya existe una categoría con ese nombre.'
            : 'Error al guardar el nombre.',
        );
      },
    });
  }

  // ── Categoría: desactivar ─────────────────────────────────────────────────

  solicitarDesactivarCat(): void {
    this.svc.impactoCategoria(this.categoria().id).subscribe({
      next: (resp) => { this.subcatsActivasCount.set(resp.subcategorias_activas); this.modalDesactivarCatVisible.set(true); },
      error: () => { this.subcatsActivasCount.set(0); this.modalDesactivarCatVisible.set(true); },
    });
  }

  cerrarModalDesactivarCat(): void {
    this.modalDesactivarCatVisible.set(false);
    this.desactivandoCat.set(false);
  }

  confirmarDesactivarCat(): void {
    this.desactivandoCat.set(true);
    this.svc.inactivarCategoria(this.categoria().id).subscribe({
      next: () => { this.desactivandoCat.set(false); this.cerrarModalDesactivarCat(); this.catalogoModificado.emit(); },
      error: () => { this.desactivandoCat.set(false); },
    });
  }

  // ── Categoría: reactivar ──────────────────────────────────────────────────

  reactivarCat(): void {
    this.procesandoCatEstado.set(true);
    this.svc.reactivarCategoria(this.categoria().id).subscribe({
      next: () => { this.procesandoCatEstado.set(false); this.catalogoModificado.emit(); },
      error: () => { this.procesandoCatEstado.set(false); },
    });
  }

  // ── Subcategoría: abrir / cerrar modal ────────────────────────────────────

  abrirModalSubcat(sub: Subcategoria): void {
    this.subcatActual.set(sub);
    this.editSubcatNombre.set(sub.nombre);
    this.errorSubcatNombre.set('');
    this.procesandoSubcatEstado.set(false);
    this.modalSubcatVisible.set(true);
  }

  cerrarModalSubcat(): void {
    this.modalSubcatVisible.set(false);
    this.subcatActual.set(null);
    this.editSubcatNombre.set('');
    this.errorSubcatNombre.set('');
  }

  // ── Subcategoría: renombrar ───────────────────────────────────────────────

  guardarNombreSubcat(): void {
    const sub = this.subcatActual();
    if (!sub) return;
    const nombre = this.editSubcatNombre().trim();
    if (!nombre) { this.errorSubcatNombre.set('El nombre es obligatorio.'); return; }
    if (nombre === sub.nombre) { this.cerrarModalSubcat(); return; }
    this.guardandoSubcatNombre.set(true);
    this.errorSubcatNombre.set('');
    this.svc.editarSubcategoria(sub.id, nombre).subscribe({
      next: () => { this.guardandoSubcatNombre.set(false); this.cerrarModalSubcat(); this.catalogoModificado.emit(); },
      error: (err) => {
        this.guardandoSubcatNombre.set(false);
        this.errorSubcatNombre.set(
          err?.error?.error === 'nombre_duplicado'
            ? 'Ya existe esa subcategoría en esta categoría.'
            : 'Error al guardar el nombre.',
        );
      },
    });
  }

  // ── Subcategoría: desactivar / reactivar ─────────────────────────────────

  desactivarSubcat(): void {
    const sub = this.subcatActual();
    if (!sub) return;
    this.procesandoSubcatEstado.set(true);
    this.svc.inactivarSubcategoria(sub.id).subscribe({
      next: () => { this.procesandoSubcatEstado.set(false); this.cerrarModalSubcat(); this.catalogoModificado.emit(); },
      error: () => { this.procesandoSubcatEstado.set(false); },
    });
  }

  reactivarSubcat(): void {
    const sub = this.subcatActual();
    if (!sub) return;
    this.procesandoSubcatEstado.set(true);
    this.svc.reactivarSubcategoria(sub.id).subscribe({
      next: () => { this.procesandoSubcatEstado.set(false); this.cerrarModalSubcat(); this.catalogoModificado.emit(); },
      error: () => { this.procesandoSubcatEstado.set(false); },
    });
  }

  // ── Quick-add: nueva subcategoría ─────────────────────────────────────────

  crearSubcategoria(): void {
    const nombre = this.nuevoNombre().trim();
    if (!nombre) { this.errorMsg.set('El nombre es obligatorio.'); return; }
    this.guardando.set(true);
    this.errorMsg.set('');
    this.svc.crearSubcategoria(nombre, this.categoria().id).subscribe({
      next: () => {
        this.nuevoNombre.set('');
        this.subcatFormVisible.set(false);
        this.guardando.set(false);
        this.catalogoModificado.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMsg.set(
          err?.error?.error === 'nombre_duplicado'
            ? 'Ya existe esa subcategoría en esta categoría.'
            : 'Error al crear la subcategoría.',
        );
      },
    });
  }

  cancelarForm(): void {
    this.subcatFormVisible.set(false);
    this.nuevoNombre.set('');
    this.errorMsg.set('');
  }
}
