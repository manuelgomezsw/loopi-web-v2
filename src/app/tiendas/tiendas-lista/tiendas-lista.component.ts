import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import {
  ListaTiendasResponse,
  TiendaResponse,
  TiendasService,
} from '../tiendas.service';

@Component({
  selector: 'app-tiendas-lista',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tiendas-lista.component.html',
})
export class TiendasListaComponent implements OnInit {
  private readonly tiendasService = inject(TiendasService);
  private readonly router = inject(Router);

  readonly tiendas = signal<TiendaResponse[]>([]);
  readonly total = signal<number>(0);
  readonly filtroEstado = signal<string>('todas');
  readonly cargando = signal<boolean>(false);
  readonly errorMsg = signal<string>('');

  readonly toastMsg = signal<string>('');
  readonly toastTipo = signal<'verde' | 'neutro' | 'rojo'>('neutro');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly pagina = signal<number>(1);
  readonly limite = 50;

  ngOnInit(): void {
    this.cargarTiendas();
  }

  irAEditar(id: number): void {
    this.router.navigate(['/tiendas', id, 'editar']);
  }

  cambiarFiltro(estado: string): void {
    this.filtroEstado.set(estado);
    this.pagina.set(1);
    this.cargarTiendas();
  }

  cargarTiendas(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    this.tiendasService
      .listar(this.filtroEstado(), this.pagina(), this.limite)
      .subscribe({
        next: (resp: ListaTiendasResponse) => {
          this.tiendas.set(resp.datos);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar las tiendas. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  private mostrarToast(msg: string, tipo: 'verde' | 'neutro' | 'rojo', ms: number): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), ms);
  }
}
