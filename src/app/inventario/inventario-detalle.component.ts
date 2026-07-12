import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InventarioService, InventarioResp } from './inventario.service';

@Component({
  selector: 'app-inventario-detalle',
  templateUrl: './inventario-detalle.component.html',
  styleUrls: []
})
export class InventarioDetalleComponent implements OnInit {
  inventario: InventarioResp | null = null;
  cargando: boolean = false;
  editando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private inventarioService: InventarioService
  ) { }

  ngOnInit(): void {
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
    if (!this.inventario) return;

    // Iterar sobre items y hacer PATCH para los modificados
    this.inventario.items.forEach(item => {
      if (item.valor_real !== null && item.valor_real !== undefined) {
        this.inventarioService.registrarValorReal(
          this.inventario!.id,
          item.item_id,
          item.valor_real
        ).subscribe({
          next: (data) => {
            item.diferencia = data.diferencia;
          },
          error: (err) => console.error('Error al guardar item:', err)
        });
      }
    });

    this.editando = false;
  }

  cancelarEdicion(): void {
    this.editando = false;
    // Recargar desde servidor
    if (this.inventario) {
      this.cargarDetalle(this.inventario.id);
    }
  }

  eliminarConteo(): void {
    if (!this.inventario || this.inventario.estado !== 'en_progreso') {
      alert('Solo se pueden eliminar conteos en progreso');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este conteo?')) {
      this.inventarioService.eliminarConteo(this.inventario.id).subscribe({
        next: () => {
          alert('Conteo eliminado');
          window.history.back();
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  puedeEditarCompletado(): boolean {
    // TODO: Verificar rol de admin desde contexto de autenticación
    return this.inventario?.estado === 'completado';
  }

  puedeEliminar(): boolean {
    // TODO: Verificar rol de admin
    return this.inventario?.estado === 'en_progreso';
  }

  diferenciaCss(diferencia: number | null | undefined): string {
    if (diferencia === null || diferencia === undefined) return '';
    return diferencia >= 0 ? 'text-green-600' : 'text-red-600';
  }
}
