import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventarioService, HistorialResp, InventarioResp } from './inventario.service';

@Component({
  selector: 'app-inventario-historial',
  templateUrl: './inventario-historial.component.html',
  styleUrls: []
})
export class InventarioHistorialComponent implements OnInit {
  inventarios: InventarioResp[] = [];
  total: number = 0;
  paginaActual: number = 1;
  totalPaginas: number = 1;
  cargando: boolean = false;

  filtros = {
    tipo: '',
    estado: '',
    desde: '',
    hasta: ''
  };

  constructor(
    private inventarioService: InventarioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;

    const filtrosObj: any = {
      pagina: this.paginaActual,
      por_pagina: 50
    };

    if (this.filtros.tipo) filtrosObj.tipo = this.filtros.tipo;
    if (this.filtros.estado) filtrosObj.estado = this.filtros.estado;
    if (this.filtros.desde) filtrosObj.desde = this.filtros.desde;
    if (this.filtros.hasta) filtrosObj.hasta = this.filtros.hasta;

    this.inventarioService.getHistorial(filtrosObj).subscribe({
      next: (data) => {
        this.inventarios = data.inventarios;
        this.total = data.total;
        this.totalPaginas = data.total_paginas;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.cargando = false;
      }
    });
  }

  verDetalle(inventarioId: number): void {
    this.router.navigate(['/inventario/detalle', inventarioId]);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarHistorial();
    }
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarHistorial();
  }

  limpiarFiltros(): void {
    this.filtros = { tipo: '', estado: '', desde: '', hasta: '' };
    this.paginaActual = 1;
    this.cargarHistorial();
  }

  estadoBadgeClass(estado: string): string {
    return estado === 'completado' ? 'badge-success' : 'badge-warning';
  }
}
