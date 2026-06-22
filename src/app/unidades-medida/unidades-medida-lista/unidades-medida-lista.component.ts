import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UnidadesMedidaService, UnidadMedida } from '../unidades-medida.service';

@Component({
  selector: 'app-unidades-medida-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './unidades-medida-lista.component.html',
})
export class UnidadesMedidaListaComponent implements OnInit, OnDestroy {
  private readonly svc = inject(UnidadesMedidaService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly unidades = signal<UnidadMedida[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly toastMsg = signal('');
  readonly toastTipo = signal<'verde' | 'rojo'>('verde');

  readonly pagina = signal(1);
  readonly limit = 50;
  readonly filtroTipo = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMsg.set('');
    const params = {
      page: this.pagina(),
      limit: this.limit,
      tipo: this.filtroTipo() || undefined,
    };
    this.svc
      .listar(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.unidades.set(resp.unidades_medida);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error al cargar las unidades. Intenta nuevamente.');
          this.cargando.set(false);
        },
      });
  }

  onFiltroTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.pagina.set(1);
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.pagina() > 1) {
      this.pagina.update((p) => p - 1);
      this.cargar();
    }
  }

  paginaSiguiente(): void {
    if (this.pagina() * this.limit < this.total()) {
      this.pagina.update((p) => p + 1);
      this.cargar();
    }
  }

  get hayPaginaAnterior(): boolean {
    return this.pagina() > 1;
  }

  get hayPaginaSiguiente(): boolean {
    return this.pagina() * this.limit < this.total();
  }

  get paginaFin(): number {
    return Math.min(this.pagina() * this.limit, this.total());
  }

  irAEditar(id: number): void {
    this.router.navigate(['/unidades-medida', id, 'editar']);
  }

  mostrarToast(msg: string, tipo: 'verde' | 'rojo', duracion = 3000): void {
    this.toastMsg.set(msg);
    this.toastTipo.set(tipo);
    setTimeout(() => this.toastMsg.set(''), duracion);
  }
}
