import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompletarConteoService } from './completar-conteo.service';
import { ConfirmarResponse, InventarioDetalle } from './completar-conteo.model';

@Component({
  selector: 'app-completar-conteo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './completar-conteo.component.html',
})
export class CompletarConteoComponent implements OnInit {
  inventarioId: number | null = null;
  inventario: InventarioDetalle | null = null;
  respuesta: ConfirmarResponse | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: CompletarConteoService
  ) {}

  ngOnInit() {
    this.inventarioId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.inventarioId) {
      this.loadInventario();
    }
  }

  loadInventario() {
    if (!this.inventarioId) return;
    this.service.getInventarioDetalle(this.inventarioId).subscribe({
      next: (data) => {
        this.inventario = data as InventarioDetalle;
      },
      error: (err) => {
        this.error = 'Error al cargar inventario';
        console.error(err);
      },
    });
  }

  confirmar() {
    if (!this.inventarioId) return;
    this.loading = true;
    this.error = null;

    this.service.confirmarConteo(this.inventarioId, { confirmar: true }).subscribe({
      next: (response) => {
        this.respuesta = response;
        this.loading = false;
        // Redirigir a historial después de confirmar
        setTimeout(() => {
          this.router.navigate(['/inventario/historial']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.error === 'CONTEO_INCOMPLETO') {
          this.error = 'Existen items sin valor registrado';
        } else if (err.error?.error === 'PERMISO_INSUFICIENTE') {
          this.error = 'No tienes permiso para confirmar este conteo';
        } else {
          this.error = err.error?.mensaje || 'Error al confirmar conteo';
        }
      },
    });
  }
}
