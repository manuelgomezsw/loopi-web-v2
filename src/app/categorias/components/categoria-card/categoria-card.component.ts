import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CategoriasService, Categoria } from '../../categorias.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-categoria-card',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './categoria-card.component.html',
})
export class CategoriaCardComponent {
  private readonly svc = inject(CategoriasService);
  private readonly router = inject(Router);

  // ─── Inputs ────────────────────────────────────────────────────────────────
  readonly categoria = input.required<Categoria>();

  // ─── Output: el padre recarga el catálogo completo tras un quick-add ───────
  readonly catalogoModificado = output<void>();

  // ─── Estado local del formulario quick-add ─────────────────────────────────
  readonly subcatFormVisible = signal(false);
  readonly nuevoNombre = signal('');
  readonly guardando = signal(false);
  readonly errorMsg = signal('');

  irAFormulario(): void {
    this.router.navigate(['/categorias', this.categoria().id, 'editar']);
  }

  crearSubcategoria(): void {
    const nombre = this.nuevoNombre().trim();
    if (!nombre) {
      this.errorMsg.set('El nombre es obligatorio.');
      return;
    }
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
