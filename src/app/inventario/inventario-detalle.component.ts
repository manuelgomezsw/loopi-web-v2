import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InventarioService, InventarioResp } from './inventario.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-inventario-detalle',
  templateUrl: './inventario-detalle.component.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class InventarioDetalleComponent implements OnInit {
  inventario: InventarioResp | null = null;
  cargando = false;
  editando = false;
  guardando = false;
  eliminando = false;
  itemsEditados = new Set<number>();
  itemErrors = new Map<number, string>();
  errorEliminar = '';
  userRole: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private inventarioService: InventarioService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userRole = this.authService.sesion()?.rol || null;
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.cargarDetalle(Number(id));
      }
    });
  }

  cargarDetalle(id: number): void {
    this.cargando = true;
    this.inventarioService.getInventario(id).subscribe({
      next: (data) => {
        this.inventario = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.cargando = false;
      }
    });
  }

  toggleEditMode(): void {
    this.editando = !this.editando;
  }

  guardarCambios(): void {
    if (!this.inventario || this.itemsEditados.size === 0) {
      this.editando = false;
      return;
    }

    this.guardando = true;
    this.itemErrors.clear();
    let guardadoCount = 0;
    const totalItems = this.itemsEditados.size;

    this.itemsEditados.forEach(itemId => {
      const item = this.inventario!.items.find(i => i.item_id === itemId);
      if (item && item.valor_real !== null && item.valor_real !== undefined) {
        this.inventarioService.registrarValorReal(
          this.inventario!.id,
          item.item_id,
          item.valor_real
        ).subscribe({
          next: (data) => {
            item.diferencia = data.diferencia;
            guardadoCount++;
            if (guardadoCount === totalItems) {
              this.guardando = false;
              this.editando = false;
              this.itemsEditados.clear();
            }
          },
          error: (err) => {
            const msg = err?.error?.mensaje || 'Error al guardar';
            this.itemErrors.set(itemId, msg);
            this.guardando = false;
          }
        });
      }
    });
  }

  cancelarEdicion(): void {
    this.editando = false;
    // Recargar desde servidor
    if (this.inventario) {
      this.cargarDetalle(this.inventario.id);
    }
  }

  eliminarConteo(): void {
    if (!this.inventario) return;

    if (this.inventario.estado !== 'en_progreso') {
      this.errorEliminar = 'Solo se pueden eliminar conteos en progreso';
      return;
    }

    if (this.userRole !== 'admin') {
      this.errorEliminar = 'Solo administradores pueden eliminar conteos';
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este conteo? Esta acción no se puede deshacer.')) {
      this.eliminando = true;
      this.errorEliminar = '';

      this.inventarioService.eliminarConteo(this.inventario.id).subscribe({
        next: () => {
          this.eliminando = false;
          window.history.back();
        },
        error: (err) => {
          this.eliminando = false;
          const status = err?.status;
          if (status === 403) {
            this.errorEliminar = 'No tienes permiso para eliminar este conteo';
          } else if (status === 422) {
            this.errorEliminar = 'No se puede eliminar un conteo completado';
          } else {
            this.errorEliminar = err?.error?.mensaje || 'Error al eliminar conteo';
          }
        }
      });
    }
  }

  marcarItemEditado(itemId: number): void {
    this.itemsEditados.add(itemId);
  }

  puedeEditarCompletado(): boolean {
    return this.userRole === 'admin' && this.inventario?.estado === 'completado';
  }

  puedeEliminar(): boolean {
    return this.userRole === 'admin' && this.inventario?.estado === 'en_progreso';
  }

  diferenciaCss(diferencia: number | null | undefined): string {
    if (diferencia === null || diferencia === undefined) return '';
    return diferencia >= 0 ? 'text-green-600' : 'text-red-600';
  }

  volver(): void {
    window.history.back();
  }
}
