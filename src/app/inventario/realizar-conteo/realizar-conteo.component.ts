import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RealizarConteoService } from './services/realizar-conteo.service';
import { ItemDetalle, ResumenProgreso } from './models';

@Component({
  selector: 'app-realizar-conteo',
  templateUrl: './realizar-conteo.component.html',
  styleUrls: ['./realizar-conteo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class RealizarConteoComponent implements OnInit {
  inventarioID!: string;
  items: ItemDetalle[] = [];
  currentIndex: number = 0;
  progreso: ResumenProgreso = {
    total_items: 0,
    completados: 0,
    pendientes: 0,
    porcentaje_progreso: 0,
  };
  autosaving: boolean = false;
  error: string | null = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RealizarConteoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.inventarioID = params['id'];
      this.cargarItems();
    });
  }

  cargarItems(): void {
    this.loading = true;
    this.service.getPrecargaItems(this.inventarioID).subscribe({
      next: (data) => {
        this.items = data.items;
        this.progreso = data.resumen;
        this.loading = false;
        this.irAlPrimeroSinRegistro();
      },
      error: (err) => {
        this.error = 'Error al cargar items';
        this.loading = false;
        console.error('Error:', err);
      },
    });
  }

  registrarValor(itemID: number, valor: number | null): void {
    if (valor === null || valor === undefined) {
      return;
    }

    if (valor < 0) {
      this.error = 'El valor debe ser 0 o mayor';
      return;
    }

    this.autosaving = true;
    this.error = null;

    this.service
      .registrarValor(this.inventarioID, String(itemID), { valor_real: valor })
      .subscribe({
        next: (response) => {
          const item = this.items.find((i) => i.item_id === itemID);
          if (item) {
            item.valor_real = response.valor_real;
            item.diferencia = response.diferencia;
            item.completado = true;
          }
          this.autosaving = false;
          this.actualizarProgreso();
          this.siguienteItem();
        },
        error: (err) => {
          this.autosaving = false;
          this.error =
            err.error?.mensaje || 'Error al guardar el valor';
          console.error('Error:', err);
        },
      });
  }

  irAlPrimeroSinRegistro(): void {
    this.currentIndex = this.items.findIndex((i) => !i.completado);
    if (this.currentIndex === -1) {
      this.currentIndex = this.items.length;
    }
  }

  siguienteItem(): void {
    this.currentIndex++;
    if (this.currentIndex < this.items.length) {
      this.irAlPrimeroSinRegistro();
    }
  }

  actualizarProgreso(): void {
    this.progreso.completados = this.items.filter(
      (i) => i.completado
    ).length;
    this.progreso.pendientes = this.items.length - this.progreso.completados;
    this.progreso.porcentaje_progreso =
      this.items.length > 0
        ? (this.progreso.completados / this.items.length) * 100
        : 0;
  }

  pausar(): void {
    this.router.navigate([`/inventarios/${this.inventarioID}`]);
  }

  cancelar(): void {
    this.router.navigate(['/inventarios']);
  }

  getDiferenciaPorcentaje(item: ItemDetalle): number | null {
    if (item.diferencia === null || item.valor_esperado === 0) {
      return null;
    }
    return (item.diferencia / item.valor_esperado) * 100;
  }

  getDiferenciaClass(item: ItemDetalle): string {
    const pct = this.getDiferenciaPorcentaje(item);
    if (pct === null) return '';
    const absPct = Math.abs(pct);
    if (absPct > 10) return 'badge-rojo';
    if (absPct <= 10) return 'badge-amarillo';
    return '';
  }

  getCurrentItem(): ItemDetalle | undefined {
    return this.items[this.currentIndex];
  }

  hayItemsPendientes(): boolean {
    return this.currentIndex < this.items.length;
  }

  retentarGuardar(): void {
    const item = this.getCurrentItem();
    if (item) {
      this.registrarValor(item.item_id, item.valor_real);
    }
  }
}
